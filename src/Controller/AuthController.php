<?php

namespace App\Controller;

use App\Entity\User;
use App\Repository\RegattaInvitationRepository;
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
use Symfony\Component\Security\Http\LoginLink\LoginLinkHandlerInterface;

class AuthController extends AbstractController
{
	public function __construct(
		private EntityManagerInterface $entityManager,
		private UserRepository $userRepository,
		private RegattaInvitationRepository $invitationRepository,
		private MailerInterface $mailer,
		private ParameterBagInterface $params,
		private LoginLinkHandlerInterface $loginLinkHandler
	) {}

	#[Route('/login', name: 'app_login')]
	public function login(): Response
	{
		// Si déjà authentifié, rediriger vers la gestion des régates
		if ($this->getUser()) {
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

		// Générer un login link avec Symfony
		$loginLinkDetails = $this->loginLinkHandler->createLoginLink($user);
		$loginUrl = $loginLinkDetails->getUrl();

		// Envoyer l'email
		$emailMessage = (new Email())
			->from($this->params->get('mailer_from'))
			->to($email)
			->subject('🔐 Votre lien de connexion Doc2Sail')
			->html($this->renderView('auth/magic_link_email.html.twig', [
				'loginUrl' => $loginUrl,
				'expiresAt' => new \DateTimeImmutable('+15 minutes'),
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

	#[Route('/login/check', name: 'app_login_check')]
	public function loginCheck(Request $request): Response
	{
		// Si l'utilisateur est authentifié, rediriger vers regatta
		/** @var User|null $user */
		$user = $this->getUser();

		if ($user) {
			// Mettre à jour le dernier login
			$user->setLastLoginAt(new \DateTimeImmutable());
			$this->entityManager->flush();

			// Vérifier s'il y a une invitation en attente
			$session = $request->getSession();
			$pendingInvitationToken = $session->get('pending_invitation_token');
			if ($pendingInvitationToken) {
				$session->remove('pending_invitation_token');
				return $this->redirectToRoute('app_regatta_accept_invitation', ['token' => $pendingInvitationToken]);
			}

			return $this->redirectToRoute('app_regatta');
		}

		// Sinon, rediriger vers login
		$this->addFlash('error', '❌ Ce lien est invalide ou a expiré.');
		return $this->redirectToRoute('app_login');
	}

	#[Route('/logout', name: 'app_logout')]
	public function logout(Request $request): Response
	{
		// Cette méthode sera interceptée par le firewall Symfony
		// Le logout est géré automatiquement dans security.yaml
		throw new \LogicException('This method should be intercepted by the logout key on your firewall.');
	}
}
