<?php

namespace App\Controller;

use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use Gesdinet\JWTRefreshTokenBundle\Model\RefreshTokenManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

class ApiTokenController extends AbstractController
{
	#[Route('/my-token', name: 'app_my_token')]
	#[IsGranted('ROLE_USER')]
	public function getMyToken(
		JWTTokenManagerInterface $jwtManager,
		RefreshTokenManagerInterface $refreshTokenManager
	): Response {
		$user = $this->getUser();

		// Génère le JWT
		$token = $jwtManager->create($user);

		// Génère le refresh token
		$datetime = new \DateTime();
		$datetime->modify('+2592000 seconds'); // 30 jours

		$refreshToken = $refreshTokenManager->create();
		$refreshToken->setUsername($user->getUserIdentifier());
		$refreshToken->setRefreshToken();
		$refreshToken->setValid($datetime);

		$refreshTokenManager->save($refreshToken);

		// Si c'est une requête API (Accept: application/json)
		if ($this->isJsonRequest()) {
			return new JsonResponse([
				'token' => $token,
				'refresh_token' => $refreshToken->getRefreshToken(),
				'expires_in' => 3600, // 1 heure
			]);
		}

		// Sinon, affiche une page web
		return $this->render('auth/my_token.html.twig', [
			'token' => $token,
			'refresh_token' => $refreshToken->getRefreshToken(),
		]);
	}

	private function isJsonRequest(): bool
	{
		$request = $this->container->get('request_stack')->getCurrentRequest();
		return $request && str_contains($request->headers->get('Accept', ''), 'application/json');
	}
}
