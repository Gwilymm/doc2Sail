<?php

namespace App\Controller;

use App\Repository\MagicLinkRepository;
use App\Repository\UserRepository;
use App\Entity\MagicLink;
use Doctrine\ORM\EntityManagerInterface;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

class ApiAuthController extends AbstractController
{
	#[Route('/api/auth/token', name: 'api_auth_token', methods: ['POST'])]
	public function token(Request $request, MagicLinkRepository $magicLinkRepo, JWTTokenManagerInterface $jwtManager, EntityManagerInterface $em): JsonResponse
	{
		$data = json_decode($request->getContent(), true);
		$token = $data['token'] ?? null;

		if (!$token) {
			return $this->json(['error' => 'Token missing'], 400);
		}

		$magicLink = $magicLinkRepo->findValidToken($token);
		if (!$magicLink) {
			return $this->json(['error' => 'Invalid or expired token'], 401);
		}

		$user = $magicLink->getUser();
		if (!$user) {
			return $this->json(['error' => 'User not found'], 404);
		}

		// Mark as used
		$magicLink->setUsed(true);
		$em->persist($magicLink);
		$em->flush();

		$jwt = $jwtManager->create($user);
		return $this->json(['token' => $jwt]);
	}

	#[Route('/api/auth/dev/magic', name: 'api_auth_dev_magic', methods: ['POST'])]
	public function generateDevMagic(Request $request, UserRepository $userRepository, EntityManagerInterface $em): JsonResponse
	{
		// Only allowed in dev
		if ($this->getParameter('kernel.environment') !== 'dev') {
			return $this->json(['error' => 'Not allowed'], 403);
		}

		$data = json_decode($request->getContent(), true);
		$email = $data['email'] ?? null;
		if (!$email) {
			return $this->json(['error' => 'Email missing'], 400);
		}

		$user = $userRepository->findOrCreateByEmail($email);

		$magic = new MagicLink();
		$magic->setUser($user);
		$em->persist($magic);
		$em->flush();

		return $this->json(['token' => $magic->getToken(), 'expiresAt' => $magic->getExpiresAt()->format(DATE_ATOM)]);
	}
}
