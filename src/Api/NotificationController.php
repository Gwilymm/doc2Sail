<?php

namespace App\Api;

use App\Dto\NotificationReadDto;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;
use Symfony\Component\Validator\Validator\ValidatorInterface;

#[Route('/api', name: 'api_')]
class NotificationController extends AbstractController
{
	#[Route('/notifications/read', name: 'notifications_read', methods: ['POST'])]
	#[IsGranted('ROLE_USER')]
	public function markAsRead(Request $request, ValidatorInterface $validator): JsonResponse
	{
		$data = json_decode($request->getContent(), true);

		if (!$data) {
			return $this->json(['error' => 'Données invalides'], 400);
		}

		$dto = new NotificationReadDto();
		$dto->notificationId = $data['notificationId'] ?? null;

		$errors = $validator->validate($dto);

		if (count($errors) > 0) {
			$errorMessages = [];
			foreach ($errors as $error) {
				$errorMessages[$error->getPropertyPath()] = $error->getMessage();
			}
			return $this->json(['errors' => $errorMessages], 400);
		}

		// TODO: Implémenter la logique de marquage de notification comme lue
		// Lorsque l'entité Notification sera créée

		return $this->json([
			'success' => true,
			'message' => 'Notification marquée comme lue',
			'notificationId' => $dto->notificationId
		]);
	}
}
