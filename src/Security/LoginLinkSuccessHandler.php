<?php

namespace App\Security;

use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Generator\UrlGeneratorInterface;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Http\Authentication\AuthenticationSuccessHandlerInterface;

class LoginLinkSuccessHandler implements AuthenticationSuccessHandlerInterface
{
	public function __construct(
		private EntityManagerInterface $entityManager,
		private UrlGeneratorInterface $urlGenerator
	) {}

	public function onAuthenticationSuccess(Request $request, TokenInterface $token): RedirectResponse
	{
		dump('=== LoginLinkSuccessHandler::onAuthenticationSuccess CALLED ===');

		/** @var User $user */
		$user = $token->getUser();

		dump('User authenticated:', [
			'id' => $user->getId(),
			'roles' => $user->getRoles(),
			'identifier' => $user->getUserIdentifier()
		]);

		// Mettre à jour le dernier login
		$user->setLastLoginAt(new \DateTimeImmutable());
		$this->entityManager->flush();

		dump('lastLoginAt updated');

		// Vérifier s'il y a une invitation en attente
		$session = $request->getSession();
		$pendingInvitationToken = $session->get('pending_invitation_token');

		if ($pendingInvitationToken) {
			dump('Pending invitation found, redirecting to accept');
			$session->remove('pending_invitation_token');
			return new RedirectResponse(
				$this->urlGenerator->generate('app_regatta_accept_invitation', [
					'token' => $pendingInvitationToken
				])
			);
		}

		// Rediriger vers la page des régates
		dump('No pending invitation, redirecting to /regatta');
		return new RedirectResponse($this->urlGenerator->generate('app_regatta'));
	}
}
