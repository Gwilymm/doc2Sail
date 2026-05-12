<?php

namespace App\Security;

use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\LoggerInterface;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Generator\UrlGeneratorInterface;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Http\Authentication\AuthenticationSuccessHandlerInterface;

class LoginLinkSuccessHandler implements AuthenticationSuccessHandlerInterface
{
	public function __construct(
		private EntityManagerInterface $entityManager,
		private UrlGeneratorInterface $urlGenerator,
		private LoggerInterface $logger,
	) {}

	public function onAuthenticationSuccess(Request $request, TokenInterface $token): RedirectResponse
	{
		/** @var User $user */
		$user = $token->getUser();
		$this->logger->debug('Login link authentication succeeded.');

		// Mettre à jour le dernier login
		$user->setLastLoginAt(new \DateTimeImmutable());
		$this->entityManager->flush();

		// Vérifier s'il y a une invitation en attente
		$session = $request->getSession();
		$pendingInvitationToken = $session->get('pending_invitation_token');

		if ($pendingInvitationToken) {
			$this->logger->debug('Redirecting authenticated user to pending invitation.');
			$session->remove('pending_invitation_token');
			return new RedirectResponse(
				$this->urlGenerator->generate('app_regatta_accept_invitation', [
					'token' => $pendingInvitationToken
				])
			);
		}

		// Rediriger vers la page des régates
		$this->logger->debug('Redirecting authenticated user to regatta index.');
		return new RedirectResponse($this->urlGenerator->generate('app_regatta'));
	}
}
