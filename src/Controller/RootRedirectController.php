<?php

// src/Controller/RootRedirectController.php
namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;

class RootRedirectController extends AbstractController
{
	public function redirectToLocale(Request $request): Response
	{
		$locale = $request->getPreferredLanguage(['fr', 'en']) ?? 'fr';
		return $this->redirectToRoute('app_home', ['_locale' => $locale]);
	}
}
