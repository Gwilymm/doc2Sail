<?php
// src/Controller/TestController.php
namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

class TestController extends AbstractController
{
	#[Route('/test-404', name: 'test_404')]
	public function test404(): Response
	{
		return $this->render('bundles/TwigBundle/Exception/error404.html.twig');
	}
}
