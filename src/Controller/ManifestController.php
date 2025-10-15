<?php

namespace App\Controller;

use App\Repository\RegattaRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Routing\Generator\UrlGeneratorInterface;

class ManifestController extends AbstractController
{
	public function __construct(
		private RegattaRepository $regattaRepository,
		private UrlGeneratorInterface $urlGenerator,
	) {}

	#[Route('/r/{token}/manifest.json', name: 'app_manifest_regatta')]
	public function regattaManifest(string $token): Response
	{
		$regatta = $this->regattaRepository->findOneBy(['accessToken' => $token]);

		if (!$regatta) {
			return new JsonResponse(['error' => 'Regatta not found'], 404);
		}

		// Générer l'URL relative pour start_url (relatif au scope /r/)
		$startUrl = '/r/' . $token;

		$manifest = [
			'name' => 'Doc2Sail - ' . $regatta->getName(),
			'short_name' => $regatta->getName(),
			'description' => 'Documents de régate pour ' . $regatta->getName(),
			'start_url' => $startUrl,
			'scope' => '/r/',
			'display' => 'standalone',
			'background_color' => '#f3f4f6',
			'theme_color' => '#0284c7',
			'orientation' => 'portrait-primary',
			'icons' => [
				[
					'src' => '/icon-192.png',
					'sizes' => '192x192',
					'type' => 'image/png',
					'purpose' => 'any'
				],
				[
					'src' => '/icon-512.png',
					'sizes' => '512x512',
					'type' => 'image/png',
					'purpose' => 'any'
				],
				[
					'src' => '/icon-512.png',
					'sizes' => '512x512',
					'type' => 'image/png',
					'purpose' => 'maskable'
				]
			],
			'categories' => ['productivity', 'utilities']
		];

		$response = new JsonResponse($manifest);
		$response->headers->set('Content-Type', 'application/manifest+json');

		// Cache pour 1 jour
		$response->setSharedMaxAge(86400);

		return $response;
	}
}
