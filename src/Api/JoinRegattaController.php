<?php

namespace App\Api;

use App\Entity\RegattaShare;
use App\Entity\User;
use App\Repository\RegattaShareRepository;
use App\Repository\RegattaRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

class JoinRegattaController extends AbstractController
{
	public function __construct(
		private RegattaRepository $regattaRepository,
		private RegattaShareRepository $regattaShareRepository,
		private EntityManagerInterface $entityManager,
	) {}

	#[Route('/api/regattas/join-by-token', name: 'api_regattas_join_by_token', methods: ['POST'])]
	#[IsGranted('ROLE_USER')]
	public function __invoke(Request $request): JsonResponse
	{
		$user = $this->getUser();
		if (!$user instanceof User) {
			return $this->json(['error' => 'Non authentifié'], 401);
		}

		$data = json_decode($request->getContent(), true);
		$token = trim((string) ($data['token'] ?? ''));

		if ($token === '') {
			return $this->json(['error' => 'Token de régate manquant'], 400);
		}

		$regatta = $this->regattaRepository->findOneBy(['accessToken' => $token]);
		if (!$regatta) {
			return $this->json(['error' => 'Cette régate n\'existe pas ou n\'est plus accessible.'], 404);
		}

		$ownership = 'saved';
		$alreadyLinked = true;
		if ($regatta->getOwner() === $user) {
			$ownership = 'owner';
		} elseif ($regatta->isCoOwner($user)) {
			$ownership = 'co_owner';
		} elseif (!$this->regattaShareRepository->existsFor($user, $regatta)) {
			$alreadyLinked = false;
			$share = (new RegattaShare())
				->setUser($user)
				->setRegatta($regatta);
			$this->entityManager->persist($share);
			$this->entityManager->flush();
		}

		return $this->json([
			'id' => $regatta->getId(),
			'name' => $regatta->getName(),
			'ownership' => $ownership,
			'alreadyLinked' => $alreadyLinked,
		]);
	}
}
