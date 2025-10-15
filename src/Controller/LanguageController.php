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
		if (!in_array($locale, ['fr', 'en'])) {
			$locale = 'fr';
		}

		// Stocker la locale dans la session
		$request->getSession()->set('_locale', $locale);

		// Rediriger vers la page précédente ou la page d'accueil
		$referer = $request->headers->get('referer');
		if ($referer) {
			return $this->redirect($referer);
		}

		return $this->redirectToRoute('app_home');
	}
}
