<?php

namespace App\Controller;

use App\Entity\MagicLink;
use App\Repository\MagicLinkRepository;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Gesdinet\JWTRefreshTokenBundle\Generator\RefreshTokenGeneratorInterface;
use Gesdinet\JWTRefreshTokenBundle\Model\RefreshTokenManagerInterface;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email;
use Symfony\Component\DependencyInjection\ParameterBag\ParameterBagInterface;
use Symfony\Component\RateLimiter\RateLimiterFactoryInterface;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Psr\Log\LoggerInterface;

class ApiAuthController extends AbstractController
{
	public function __construct(
		private EntityManagerInterface $em,
		private UserRepository $userRepository,
		private MagicLinkRepository $magicLinkRepo,
		private JWTTokenManagerInterface $jwtManager,
		private RefreshTokenGeneratorInterface $refreshTokenGenerator,
		private RefreshTokenManagerInterface $refreshTokenManager,
		private MailerInterface $mailer,
		private ParameterBagInterface $params,
		#[Autowire(service: 'limiter.magic_link_request_by_email')]
		private RateLimiterFactoryInterface $magicLinkLimiter,
		private LoggerInterface $logger
	) {}

	/**
	 * Demande un magic link pour authentification mobile
	 * POST /api/auth/request {email, displayName?}
	 * Retourne: {success, expiresIn, message}
	 */
	#[Route('/api/auth/request', name: 'api_auth_request', methods: ['POST'])]
	public function request(Request $request): JsonResponse
	{
		$data = json_decode($request->getContent(), true);
		$rawEmail = $data['email'] ?? null;

		if (!$rawEmail) {
			return $this->json(['error' => 'Email requis'], 400);
		}

		$email = trim(strtolower($rawEmail));

		// Validation email
		if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
			// Message neutre pour éviter énumération
			return $this->json([
				'success' => true,
				'message' => 'Si un compte existe, un code a été envoyé par email.'
			], 200);
		}

		// Rate limiting par email + IP
		$key = sprintf('%s|%s', $email, $request->getClientIp() ?? 'noip');
		$limiter = $this->magicLinkLimiter->create($key);
		$limit = $limiter->consume(1);

		if (!$limit->isAccepted()) {
			return $this->json([
				'error' => 'Trop de demandes. Veuillez réessayer plus tard.',
				'retryAfter' => $limit->getRetryAfter()?->getTimestamp()
			], 429);
		}

		// Trouver ou créer l'utilisateur
		$displayName = $data['displayName'] ?? null;
		$user = $this->userRepository->findOrCreateByEmail($email, $displayName);

		// Anti-spam : max 3 magic links actifs par utilisateur
		$activeLinks = $this->magicLinkRepo->countActiveLinksForUser($user->getId());
		if ($activeLinks >= 3) {
			return $this->json([
				'error' => 'Trop de codes actifs. Veuillez utiliser un code existant ou attendre son expiration.'
			], 429);
		}

		// Si un link actif existe (créé il y a moins de 15 minutes), on renvoie un message sans en créer un nouveau,
		// sauf si le client demande explicitement 'force' pour invalider et en générer un nouveau.
		$existing = $this->magicLinkRepo->findLatestActiveLinkForUser($user->getId());
		$force = isset($data['force']) && (bool)$data['force'];
		if ($existing && !$force) {
			return $this->json([
				'success' => true,
				'alreadySent' => true,
				'expiresIn' => $existing->getRemainingSeconds(),
				'message' => 'Un code a déjà été envoyé. Veuillez utiliser ce code ou demandez-en un nouveau.'
			], 200);
		}

		if ($force && $existing) {
			// Invalider les liens actifs de l'utilisateur
			$this->magicLinkRepo->invalidateUserActiveLinks($user->getId());
		}

		// Créer le magic link
		$magicLink = new MagicLink();
		$magicLink->setUser($user);
		$magicLink->setEmailHash(hash('sha256', $email)); // Hash SHA-256 de l'email
		$magicLink->setIpAddress($request->getClientIp());
		$magicLink->setUserAgent($request->headers->get('User-Agent'));

		$this->em->persist($magicLink);
		$this->em->flush();

		// Envoyer l'email
		$this->sendMagicLinkEmail($user, $magicLink, $email);

		return $this->json([
			'success' => true,
			'expiresIn' => $magicLink->getRemainingSeconds(),
			'message' => 'Un code de connexion a été envoyé par email.'
		], 200);
	}

	/**
	 * Vérifie un code court et retourne un JWT
	 * POST /api/auth/verify {code}
	 * Retourne: {token, refreshToken, user}
	 */
	#[Route('/api/auth/verify', name: 'api_auth_verify', methods: ['POST'])]
	public function verify(Request $request): JsonResponse
	{
		$data = json_decode($request->getContent(), true);
		$code = $data['code'] ?? null;

		if (!$code) {
			return $this->json(['error' => 'Code requis'], 400);
		}

		// Trouver le magic link par code court
		$magicLink = $this->magicLinkRepo->findByShortCode($code);

		if (!$magicLink || !$magicLink->isValid()) {
			return $this->json(['error' => 'Code invalide ou expiré'], 401);
		}

		$user = $magicLink->getUser();

		// Marquer le magic link comme utilisé
		$magicLink->incrementUseCount();
		$user->setLastLoginAt(new \DateTimeImmutable());
		$this->em->flush();

		// Générer JWT + refresh token
		$jwt = $this->jwtManager->create($user);

		$refreshToken = $this->refreshTokenGenerator->createForUserWithTtl($user, 2592000);
		$this->refreshTokenManager->save($refreshToken);

		return $this->json([
			'token' => $jwt,
			'refresh_token' => $refreshToken->getRefreshToken(),
			'user' => [
				'id' => $user->getId(),
				'displayName' => $user->getDisplayName(),
				'roles' => $user->getRoles(),
			]
		], 200);
	}

	private function sendMagicLinkEmail($user, MagicLink $magicLink, string $email): void
	{
		$emailMessage = (new Email())
			->from($this->params->get('mailer_from'))
			->to($email)
			->subject('🔐 Votre code de connexion Doc2Sail')
			->html($this->renderView('auth/magic_link_mobile_email.html.twig', [
				'shortCode' => $magicLink->getPlainShortCode(),
				'expiresAt' => $magicLink->getExpiresAt(),
				'displayName' => $user->getDisplayName(),
			]));

		try {
			$this->mailer->send($emailMessage);
		} catch (\Throwable $e) {
			$this->logger->error('Mobile magic code email failed to send', [
				'exception' => $e,
				'recipient_domain' => substr(strrchr($email, '@') ?: '', 1),
				'mailer_from' => $this->params->get('mailer_from'),
			]);

			// En dev, afficher le code dans les logs
			if ($this->getParameter('kernel.environment') === 'dev') {
				$this->container->get('logger')->info('Magic link code: ' . $magicLink->getPlainShortCode());
			}
		}
	}

	// Endpoints dev conservés
	#[Route('/api/auth/token', name: 'api_auth_token', methods: ['POST'])]
	public function token(Request $request): JsonResponse
	{
		$data = json_decode($request->getContent(), true);
		$token = $data['token'] ?? null;

		if (!$token) {
			return $this->json(['error' => 'Token missing'], 400);
		}

		$magicLink = $this->magicLinkRepo->findValidToken($token);
		if (!$magicLink) {
			return $this->json(['error' => 'Invalid or expired token'], 401);
		}

		$user = $magicLink->getUser();
		if (!$user) {
			return $this->json(['error' => 'User not found'], 404);
		}

		// Mark as used
		$magicLink->setUsed(true);
		$this->em->persist($magicLink);
		$this->em->flush();

		$jwt = $this->jwtManager->create($user);
		return $this->json(['token' => $jwt]);
	}

	#[Route('/api/auth/dev/magic', name: 'api_auth_dev_magic', methods: ['POST'])]
	public function generateDevMagic(Request $request): JsonResponse
	{
		// Only allowed in dev
		if ($this->getParameter('kernel.environment') !== 'dev') {
			return $this->json(['error' => 'Not allowed'], 403);
		}

		$data = json_decode($request->getContent(), true);
		$email = $data['email'] ?? null;
		if (!$email) {
			return $this->json(['error' => 'Email missing'], 400);
		}

		$user = $this->userRepository->findOrCreateByEmail($email);

		$magic = new MagicLink();
		$magic->setUser($user);
		$this->em->persist($magic);
		$this->em->flush();

		return $this->json([
			'token' => $magic->getToken(),
			'shortCode' => $magic->getPlainShortCode(),
			'expiresAt' => $magic->getExpiresAt()->format(DATE_ATOM)
		]);
	}
}
