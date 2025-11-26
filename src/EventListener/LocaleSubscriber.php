<?php

namespace App\EventListener;

use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\KernelEvents;

class LocaleSubscriber implements EventSubscriberInterface
{
	private string $defaultLocale;
	private const SUPPORTED = ['en', 'fr'];

	public function __construct(string $defaultLocale = 'fr')
	{
		$this->defaultLocale = $defaultLocale;
	}

	public function onKernelRequest(RequestEvent $event): void
	{
		$request = $event->getRequest();

		// Ne pas écraser si locale forcée par l'URL (/{_locale}/...)
		if ($request->attributes->get('_locale')) {
			return;
		}

		// 1. Query param explicite ?lang=fr
		$paramLocale = $request->query->get('lang');
		if ($paramLocale && in_array($paramLocale, self::SUPPORTED, true)) {
			$request->setLocale($paramLocale);
			return;
		}

		// 2. Session précédente
		if ($request->hasPreviousSession()) {
			if ($sessionLocale = $request->getSession()->get('_locale')) {
				$request->setLocale($sessionLocale);
				return;
			}
		}

		// 3. Header Accept-Language
		if ($accept = $request->headers->get('Accept-Language')) {
			$parts = explode(',', $accept);
			foreach ($parts as $part) {
				$lang = strtolower(trim(explode(';', $part)[0]));
				$langShort = substr($lang, 0, 2);
				if (in_array($langShort, self::SUPPORTED, true)) {
					$request->setLocale($langShort);
					return;
				}
			}
		}

		// 4. Fallback
		$request->setLocale($this->defaultLocale);
	}

	public static function getSubscribedEvents(): array
	{
		return [
			KernelEvents::REQUEST => [['onKernelRequest', 20]],
		];
	}
}
