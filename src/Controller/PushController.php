<?php

namespace App\Controller;

use App\Service\WebPushService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/push')]
class PushController extends AbstractController
{
	public function __construct(
		private WebPushService $webPushService
	) {}

	/**
	 * Retourne la clé publique VAPID pour le client
	 */
	#[Route('/public-key', name: 'app_push_public_key', methods: ['GET'])]
	public function publicKey(): JsonResponse
	{
		return new JsonResponse([
			'publicKey' => $this->webPushService->getPublicKey(),
		]);
	}

	/**
	 * Enregistre un nouvel abonnement push
	 */
	#[Route('/subscribe', name: 'app_push_subscribe', methods: ['POST'])]
	public function subscribe(Request $request): JsonResponse
	{
		try {
			$data = json_decode($request->getContent(), true);

			if (!isset($data['endpoint'], $data['keys']['p256dh'], $data['keys']['auth'])) {
				return new JsonResponse(['error' => 'Invalid subscription data'], 400);
			}

			$subscription = $this->webPushService->subscribe(
				endpoint: $data['endpoint'],
				publicKey: $data['keys']['p256dh'],
				authToken: $data['keys']['auth'],
				regattaToken: $data['regattaToken'] ?? null
			);

			return new JsonResponse([
				'success' => true,
				'message' => 'Subscription created successfully',
				'id' => $subscription->getId(),
			]);
		} catch (\Exception $e) {
			return new JsonResponse([
				'error' => $e->getMessage(),
			], 500);
		}
	}

	/**
	 * Supprime un abonnement push
	 */
	#[Route('/unsubscribe', name: 'app_push_unsubscribe', methods: ['POST'])]
	public function unsubscribe(Request $request): JsonResponse
	{
		try {
			$data = json_decode($request->getContent(), true);

			if (!isset($data['endpoint'])) {
				return new JsonResponse(['error' => 'Endpoint required'], 400);
			}

			$success = $this->webPushService->unsubscribe($data['endpoint']);

			if ($success) {
				return new JsonResponse([
					'success' => true,
					'message' => 'Subscription removed successfully',
				]);
			} else {
				return new JsonResponse([
					'error' => 'Subscription not found',
				], 404);
			}
		} catch (\Exception $e) {
			return new JsonResponse([
				'error' => $e->getMessage(),
			], 500);
		}
	}
}
