<?php

namespace App\Service;

use App\Entity\PushSubscription;
use App\Repository\PushSubscriptionRepository;
use Doctrine\ORM\EntityManagerInterface;
use Minishlink\WebPush\WebPush;
use Minishlink\WebPush\Subscription;
use Psr\Log\LoggerInterface;

class WebPushService
{
	public function __construct(
		private EntityManagerInterface $entityManager,
		private PushSubscriptionRepository $subscriptionRepository,
		private LoggerInterface $logger,
		private string $vapidPublicKey,
		private string $vapidPrivateKey,
		private string $vapidSubject
	) {}

	/**
	 * Envoie une notification push à tous les abonnés d'une régate
	 */
	public function sendNotification(string $regattaToken, string $title, string $body, array $data = []): int
	{
		$subscriptions = $this->subscriptionRepository->findByRegattaToken($regattaToken);

		$this->logger->info('Attempting to send push notifications', [
			'regattaToken' => $regattaToken,
			'subscriptionCount' => count($subscriptions),
		]);

		if (empty($subscriptions)) {
			$this->logger->info('No push subscriptions found for regatta', ['token' => $regattaToken]);
			return 0;
		}

		$webPush = new WebPush([
			'VAPID' => [
				'subject' => $this->vapidSubject,
				'publicKey' => $this->vapidPublicKey,
				'privateKey' => $this->vapidPrivateKey,
			],
		]);

		$payload = json_encode([
			'title' => $title,
			'body' => $body,
			'icon' => '/icon-192.png',
			'badge' => '/icon-72.png',
			'data' => $data,
		]);

		$this->logger->info('Push payload prepared', ['payload' => $payload]);

		$sentCount = 0;
		$failedEndpoints = [];

		foreach ($subscriptions as $pushSubscription) {
			try {
				$this->logger->info('Processing subscription', [
					'endpoint' => substr($pushSubscription->getEndpoint(), 0, 50) . '...',
					'regattaToken' => $pushSubscription->getRegattaToken(),
				]);

				$subscription = Subscription::create($pushSubscription->toArray());

				$webPush->queueNotification(
					$subscription,
					$payload
				);

				$pushSubscription->setLastUsedAt(new \DateTime());
				$sentCount++;

				$this->logger->info('Notification queued successfully');
			} catch (\Exception $e) {
				$this->logger->error('Failed to queue push notification', [
					'error' => $e->getMessage(),
					'endpoint' => $pushSubscription->getEndpoint(),
				]);
				$failedEndpoints[] = $pushSubscription->getEndpoint();
			}
		}

		// Envoyer toutes les notifications
		$this->logger->info('Flushing notifications', ['queuedCount' => $sentCount]);

		foreach ($webPush->flush() as $report) {
			$this->logger->info('Push report received', [
				'endpoint' => substr($report->getEndpoint(), 0, 50) . '...',
				'success' => $report->isSuccess(),
				'statusCode' => $report->getResponse() ? $report->getResponse()->getStatusCode() : null,
			]);

			if (!$report->isSuccess()) {
				$this->logger->warning('Push notification failed', [
					'endpoint' => $report->getEndpoint(),
					'reason' => $report->getReason(),
					'expired' => $report->isSubscriptionExpired(),
				]);

				// Si l'abonnement est invalide (410 Gone), le supprimer
				if ($report->isSubscriptionExpired()) {
					$subscription = $this->subscriptionRepository->findByEndpoint($report->getEndpoint());
					if ($subscription) {
						$this->entityManager->remove($subscription);
						$this->logger->info('Removed expired push subscription', [
							'endpoint' => $report->getEndpoint(),
						]);
					}
				}
			} else {
				$this->logger->info('Push notification sent successfully!');
			}
		}

		$this->entityManager->flush();

		$this->logger->info('Push notifications sent', [
			'regattaToken' => $regattaToken,
			'sent' => $sentCount,
			'total' => count($subscriptions),
		]);

		return $sentCount;
	}

	/**
	 * Crée ou met à jour un abonnement push
	 */
	public function subscribe(string $endpoint, string $publicKey, string $authToken, ?string $regattaToken = null): PushSubscription
	{
		$subscription = $this->subscriptionRepository->findByEndpoint($endpoint);

		if (!$subscription) {
			$subscription = new PushSubscription();
			$subscription->setEndpoint($endpoint);
		}

		$subscription->setPublicKey($publicKey);
		$subscription->setAuthToken($authToken);
		$subscription->setRegattaToken($regattaToken);
		$subscription->setLastUsedAt(new \DateTime());

		$this->entityManager->persist($subscription);
		$this->entityManager->flush();

		$this->logger->info('Push subscription created/updated', [
			'endpoint' => $endpoint,
			'regattaToken' => $regattaToken,
		]);

		return $subscription;
	}

	/**
	 * Supprime un abonnement push
	 */
	public function unsubscribe(string $endpoint): bool
	{
		$subscription = $this->subscriptionRepository->findByEndpoint($endpoint);

		if ($subscription) {
			$this->entityManager->remove($subscription);
			$this->entityManager->flush();

			$this->logger->info('Push subscription removed', ['endpoint' => $endpoint]);
			return true;
		}

		return false;
	}

	/**
	 * Retourne la clé publique VAPID
	 */
	public function getPublicKey(): string
	{
		return $this->vapidPublicKey;
	}
}
