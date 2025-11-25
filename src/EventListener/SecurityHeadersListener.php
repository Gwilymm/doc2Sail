<?php

namespace App\EventListener;

use Symfony\Component\HttpKernel\Event\ResponseEvent;
use Symfony\Component\EventDispatcher\Attribute\AsEventListener;

/**
 * Injecte les security headers dans toutes les réponses HTTP
 * Priority 4 - Sécurité Infrastructure
 */
#[AsEventListener(event: 'kernel.response')]
class SecurityHeadersListener
{
	public function __invoke(ResponseEvent $event): void
	{
		if (!$event->isMainRequest()) {
			return;
		}

		$response = $event->getResponse();
		$headers = $response->headers;

		// Anti-Clickjacking : Empêche l'iframe embedding
		$headers->set('X-Frame-Options', 'DENY');

		// Anti-MIME sniffing : Force respect du Content-Type
		$headers->set('X-Content-Type-Options', 'nosniff');

		// XSS Protection (legacy browsers support)
		$headers->set('X-XSS-Protection', '1; mode=block');

		// HSTS : Force HTTPS pendant 1 an (31536000 secondes)
		// Attention : Activer uniquement si HTTPS configuré en production
		if ($event->getRequest()->isSecure()) {
			$headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
		}

		// Content Security Policy : Restreint sources de contenu
		// Adapté pour API (pas de scripts/styles inline)
		$csp = implode('; ', [
			"default-src 'self'",
			"script-src 'self'",
			"style-src 'self' 'unsafe-inline'", // unsafe-inline pour emails HTML
			"img-src 'self' data: https:",
			"font-src 'self'",
			"connect-src 'self'",
			"frame-ancestors 'none'", // Equivalent à X-Frame-Options DENY
			"base-uri 'self'",
			"form-action 'self'",
			"object-src 'none'",
			"upgrade-insecure-requests"
		]);
		$headers->set('Content-Security-Policy', $csp);

		// Referrer Policy : Contrôle info envoyée dans referer
		$headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');

		// Permissions Policy : Désactive APIs non utilisées
		$permissions = implode(', ', [
			'geolocation=()',
			'microphone=()',
			'camera=()',
			'payment=()',
			'usb=()',
			'magnetometer=()',
			'gyroscope=()',
			'accelerometer=()'
		]);
		$headers->set('Permissions-Policy', $permissions);

		// Cache-Control pour endpoints sensibles (auth)
		if (str_contains($event->getRequest()->getPathInfo(), '/api/auth/')) {
			$headers->set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
			$headers->set('Pragma', 'no-cache');
		}
	}
}
