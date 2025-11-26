<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

class UserController extends AbstractController
{
	#[Route('/api/me', name: 'api_me', methods: ['GET'])]
	#[IsGranted('ROLE_USER')]
	public function me(): JsonResponse
	{
		/** @var \App\Entity\User $user */
		$user = $this->getUser();

		if (!$user) {
			return new JsonResponse(['error' => 'User not found'], 401);
		}

		return new JsonResponse([
			'id' => $user->getId(),
			'email' => $user->getUserIdentifier(), // Retourne l'ID pour l'instant
			'displayName' => $user->getDisplayName(),
			'firstName' => $user->getDisplayName(),
			'lastName' => null,
			'roles' => $user->getRoles(),
			'createdAt' => $user->getCreatedAt()?->format(\DateTimeInterface::ATOM),
			'lastLoginAt' => $user->getLastLoginAt()?->format(\DateTimeInterface::ATOM),
		]);
	}
}
