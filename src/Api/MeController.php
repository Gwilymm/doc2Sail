<?php

namespace App\Api;

use App\Dto\UserMeDto;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api', name: 'api_')]
class MeController extends AbstractController
{
	#[Route('/me', name: 'me', methods: ['GET'])]
	#[IsGranted('ROLE_USER')]
	public function me(): JsonResponse
	{
		$user = $this->getUser();

		if (!$user) {
			return $this->json(['error' => 'Non authentifié'], 401);
		}

		$dto = new UserMeDto();
		$dto->id = $user->getId();
		$dto->displayName = $user->getDisplayName();
		$dto->roles = $user->getRoles();
		$dto->createdAt = $user->getCreatedAt();
		$dto->lastLoginAt = $user->getLastLoginAt();
		$dto->regattasCount = $user->getRegattas()->count();
		$dto->sharedRegattasCount = $user->getSharedRegattas()->count();

		return $this->json($dto);
	}
}
