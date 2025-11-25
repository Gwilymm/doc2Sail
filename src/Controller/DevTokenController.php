<?php

namespace App\Controller;

use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use Gesdinet\JWTRefreshTokenBundle\Model\RefreshTokenManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/dev')]
class DevTokenController extends AbstractController
{
	#[Route('/token', name: 'api_dev_get_token', methods: ['POST'])]
	public function getToken(
		EntityManagerInterface $em,
		JWTTokenManagerInterface $jwtManager,
		RefreshTokenManagerInterface $refreshTokenManager
	): JsonResponse {
		// En développement seulement !
		if ($_ENV['APP_ENV'] !== 'dev') {
			return new JsonResponse(['error' => 'Only available in dev environment'], 403);
		}

		// Récupère le premier utilisateur
		$user = $em->getRepository(User::class)->findOneBy([]);

		if (!$user) {
			return new JsonResponse(['error' => 'No user found'], 404);
		}

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

		return new JsonResponse([
			'token' => $token,
			'refresh_token' => $refreshToken->getRefreshToken(),
			'user_id' => $user->getId(),
		]);
	}

	#[Route('/refresh-tokens', name: 'api_dev_list_refresh_tokens', methods: ['GET'])]
	public function listRefreshTokens(EntityManagerInterface $em): JsonResponse
	{
		if ($_ENV['APP_ENV'] !== 'dev') {
			return new JsonResponse(['error' => 'Only available in dev environment'], 403);
		}

		$sql = "SELECT id, refresh_token, username, valid FROM refresh_tokens ORDER BY valid DESC LIMIT 10";
		$stmt = $em->getConnection()->prepare($sql);
		$result = $stmt->executeQuery();

		return new JsonResponse([
			'refresh_tokens' => $result->fetchAllAssociative()
		]);
	}
}
