<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

class HomeController extends AbstractController
{
	#[Route('/', name: 'app_home')]
	// la route peut être préfixée par /{_locale} grâce à config/routes.yaml
	public function index(Request $request): Response
	{
		$locale = $request->getLocale();
		if ($this->isGranted('ROLE_USER')) {
			return $this->redirectToRoute('app_regatta');
		}

		return $this->render('home/index.html.twig');
	}
}
