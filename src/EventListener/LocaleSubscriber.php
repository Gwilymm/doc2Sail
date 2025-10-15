<?php

namespace App\EventListener;

use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\KernelEvents;

class LocaleSubscriber implements EventSubscriberInterface
{
	private string $defaultLocale;

	public function __construct(string $defaultLocale = 'fr')
	{
		$this->defaultLocale = $defaultLocale;
	}

	public function onKernelRequest(RequestEvent $event): void
	{
		$request = $event->getRequest();

		// Essayer de récupérer la locale depuis la session
		if (!$request->hasPreviousSession()) {
			return;
		}

		// Si la locale est définie dans la session, l'utiliser
		if ($locale = $request->getSession()->get('_locale')) {
			$request->setLocale($locale);
		} else {
			$request->setLocale($this->defaultLocale);
		}
	}

	public static function getSubscribedEvents(): array
	{
		return [
			KernelEvents::REQUEST => [['onKernelRequest', 20]],
		];
	}
}
