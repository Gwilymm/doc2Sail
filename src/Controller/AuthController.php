<?php

namespace App\Controller;

use App\Entity\User;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\DependencyInjection\ParameterBag\ParameterBagInterface;
use Symfony\Component\Security\Http\LoginLink\LoginLinkHandlerInterface;

class AuthController extends AbstractController
{
	public function __construct(
		private EntityManagerInterface $entityManager,
		private UserRepository $userRepository,
		private MailerInterface $mailer,
		private ParameterBagInterface $params
	) {}

	#[Route('/login', name: 'app_login')]
	public function login(
		LoginLinkHandlerInterface $loginLinkHandler,
		Request $request
	): Response {
		// Si POST, générer et envoyer le magic link
		if ($request->isMethod('POST')) {
			$email = trim(strtolower($request->request->get('email', '')));
			$displayName = trim($request->request->get('display_name', ''));

			if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
				$this->addFlash('error', 'Adresse email invalide.');
				return $this->redirectToRoute('app_login');
			}

			// Trouver ou créer l'utilisateur
			$user = $this->userRepository->findOrCreateByEmail($email, $displayName ?: null);

			// Générer le login link avec Symfony
			$loginLinkDetails = $loginLinkHandler->createLoginLink($user);
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

		// Si GET, afficher le formulaire
		return $this->render('auth/login.html.twig');
	}

	#[Route('/login_check', name: 'app_login_check')]
	public function check(): never
	{
		// Cette méthode est interceptée par Symfony Security (login_link)
		throw new \LogicException('This code should never be reached');
	}

	#[Route('/logout', name: 'app_logout')]
	public function logout(): never
	{
		// Cette méthode est interceptée par Symfony Security
		throw new \LogicException('This code should never be reached');
	}
}
