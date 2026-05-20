<?php

namespace App\Api;

use App\Dto\UserMeDto;
use App\Entity\User;
use App\Repository\RegattaShareRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

class MeController extends AbstractController
{
	public function __construct(
		private RegattaShareRepository $regattaShareRepository,
	) {}

	#[Route('/api/me', name: 'api_me', methods: ['GET'])]
	#[IsGranted('ROLE_USER')]
	public function me(): JsonResponse
	{
		$user = $this->getUser();

		if (!$user instanceof User) {
			return $this->json(['error' => 'Non authentifié'], 401);
		}

		$dto = new UserMeDto();
		$dto->id = $user->getId();
		$dto->displayName = $user->getDisplayName();
		$dto->roles = $user->getRoles();
		$dto->createdAt = $user->getCreatedAt();
		$dto->lastLoginAt = $user->getLastLoginAt();
		$dto->regattasCount = $user->getRegattas()->count();
		$dto->sharedRegattasCount = $user->getSharedRegattas()->count() + $this->regattaShareRepository->countForUser($user);

		return $this->json($dto);
	}

	#[Route('/api/me', name: 'api_me_patch', methods: ['PATCH'])]
	#[IsGranted('ROLE_USER')]
	public function updateMe(Request $request, EntityManagerInterface $em): JsonResponse
	{
		$user = $this->getUser();

		if (!$user instanceof User) {
			return $this->json(['error' => 'Non authentifié'], 401);
		}

		$data = json_decode($request->getContent(), true);

		if (array_key_exists('displayName', $data)) {
			$name = trim((string) ($data['displayName'] ?? ''));
			$user->setDisplayName($name !== '' ? $name : null);
			$em->flush();
		}

		return $this->json(['displayName' => $user->getDisplayName()]);
	}
}
