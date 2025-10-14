<?php

namespace App\EventListener;

use Symfony\Component\EventDispatcher\Attribute\AsEventListener;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\Routing\Generator\UrlGeneratorInterface;

#[AsEventListener(event: 'kernel.request', priority: 10)]
class AuthenticationListener
{
	private array $protectedRoutes = [
		'app_regatta',
		'app_regatta_create',
		'app_regatta_update',
		'app_regatta_delete',
		'app_regatta_documents',
		'app_document_upload',
		'app_document_delete',
	];

	public function __construct(
		private UrlGeneratorInterface $urlGenerator
	) {}

	public function __invoke(RequestEvent $event): void
	{
		$request = $event->getRequest();
		$route = $request->attributes->get('_route');

		// Si la route n'est pas protégée, laisser passer
		if (!in_array($route, $this->protectedRoutes, true)) {
			return;
		}

		// Vérifier l'authentification
		$session = $request->getSession();
		$isAuthenticated = $session->get('authenticated', false) === true;
		$userId = $session->get('user_id');

		// Optionnel : Expiration après 30 jours
		$authTime = $session->get('auth_time', 0);
		if ($authTime && (time() - $authTime) > (86400 * 30)) { // 30 jours
			$session->invalidate();
			$isAuthenticated = false;
		}

		if (!$isAuthenticated || !$userId) {
			// Rediriger vers la page de login
			$response = new RedirectResponse($this->urlGenerator->generate('app_login'));
			$event->setResponse($response);
		}
	}
}
