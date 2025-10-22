<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

class LanguageController extends AbstractController
{
	#[Route('/language/{locale}', name: 'app_change_language')]
	public function changeLanguage(string $locale, Request $request): Response
	{
		// Vérifier que la locale est valide
		$available = ['fr', 'en'];
		if (!in_array($locale, $available, true)) {
			$locale = 'fr';
		}

		// Stocker la locale dans la session
		$request->getSession()->set('_locale', $locale);

		// Essayer de reconstruire l'URL précédente avec la nouvelle locale
		$referer = $request->headers->get('referer');
		if ($referer) {
			$parts = parse_url($referer);
			$path = $parts['path'] ?? '/';
			$query = $parts['query'] ?? '';
			$fragment = isset($parts['fragment']) ? '#' . $parts['fragment'] : '';

			// Remplacer le premier segment s'il est une locale connue, sinon préfixer
			$segments = explode('/', ltrim($path, '/'));
			if (isset($segments[0]) && in_array($segments[0], $available, true)) {
				$segments[0] = $locale;
				$newPath = '/' . implode('/', $segments);
			} else {
				// Préfixe la route sans locale
				$newPath = '/' . rtrim($locale, '/') . ($path === '/' ? '/' : $path);
			}

			$newUrl = $newPath . ($query ? '?' . $query : '') . $fragment;
			return $this->redirect($newUrl);
		}

		// Fallback vers la home locale
		return $this->redirectToRoute('app_home', ['_locale' => $locale]);
	}
}
