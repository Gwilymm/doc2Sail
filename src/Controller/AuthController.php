<?php

namespace App\Controller;

use App\Entity\MagicLink;
use App\Repository\MagicLinkRepository;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Routing\Generator\UrlGeneratorInterface;
use Symfony\Component\DependencyInjection\ParameterBag\ParameterBagInterface;

class AuthController extends AbstractController
{
	public function __construct(
		private EntityManagerInterface $entityManager,
		private UserRepository $userRepository,
		private MagicLinkRepository $magicLinkRepository,
		private MailerInterface $mailer,
		private ParameterBagInterface $params
	) {}

	#[Route('/login', name: 'app_login')]
	public function login(): Response
	{
		// Si déjà authentifié, rediriger vers la gestion des régates
		if ($this->isAuthenticated()) {
			return $this->redirectToRoute('app_regatta');
		}

		return $this->render('auth/login.html.twig');
	}

	#[Route('/login/magic-link', name: 'app_magic_link_request', methods: ['POST'])]
	public function requestMagicLink(Request $request): Response
	{
		$email = trim(strtolower($request->request->get('email', '')));
		$displayName = trim($request->request->get('display_name', ''));

		if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
			$this->addFlash('error', 'Adresse email invalide.');
			return $this->redirectToRoute('app_login');
		}

		// Trouver ou créer l'utilisateur
		$user = $this->userRepository->findOrCreateByEmail($email, $displayName ?: null);

		// Créer un nouveau magic link
		$magicLink = new MagicLink();
		$magicLink->setUser($user);

		$this->entityManager->persist($magicLink);
		$this->entityManager->flush();

		// Envoyer l'email
		$loginUrl = $this->generateUrl('app_magic_link_verify', [
			'token' => $magicLink->getToken()
		], UrlGeneratorInterface::ABSOLUTE_URL);

		$emailMessage = (new Email())
			->from($this->params->get('mailer_from'))
			->to($email)
			->subject('🔐 Votre lien de connexion Doc2Sail')
			->html($this->renderView('auth/magic_link_email.html.twig', [
				'loginUrl' => $loginUrl,
				'expiresAt' => $magicLink->getExpiresAt(),
				'displayName' => $user->getDisplayName()
			]));

		try {
			$this->mailer->send($emailMessage);
			$this->addFlash('success', '📧 Magic link envoyé ! Vérifiez votre boîte mail.');
		} catch (\Exception $e) {
			$this->addFlash('info', sprintf(
				'⚠️ Email non configuré (dev mode). Utilisez ce lien : <a href="%s" class="link link-primary">%s</a>',
				$loginUrl,
				$loginUrl
			));
		}

		return $this->redirectToRoute('app_login');
	}

	#[Route('/login/verify/{token}', name: 'app_magic_link_verify')]
	public function verifyMagicLink(string $token, Request $request): Response
	{
		$magicLink = $this->magicLinkRepository->findValidToken($token);

		if (!$magicLink || !$magicLink->isValid()) {
			$this->addFlash('error', '❌ Ce lien est invalide ou a expiré. Demandez un nouveau lien.');
			return $this->redirectToRoute('app_login');
		}

		// Marquer le lien comme utilisé
		$magicLink->setUsed(true);
		$this->entityManager->flush();

		// Mettre à jour le dernier login
		$user = $magicLink->getUser();
		$user->setLastLoginAt(new \DateTimeImmutable());
		$this->entityManager->flush();

		// Créer la session
		$session = $request->getSession();
		$session->set('user_id', $user->getId());
		$session->set('authenticated', true);
		$session->set('auth_time', time());

		$this->addFlash('success', sprintf(
			'✅ Bienvenue %s !',
			$user->getDisplayName() ?? 'sur Doc2Sail'
		));

		return $this->redirectToRoute('app_regatta');
	}

	#[Route('/logout', name: 'app_logout')]
	public function logout(Request $request): Response
	{
		$request->getSession()->invalidate();
		$this->addFlash('info', 'Vous avez été déconnecté.');
		return $this->redirectToRoute('app_home');
	}

	private function isAuthenticated(): bool
	{
		$session = $this->container->get('request_stack')->getCurrentRequest()?->getSession();
		return $session && $session->get('authenticated', false) === true;
	}
}
