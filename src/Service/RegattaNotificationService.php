<?php

namespace App\Service;

use Symfony\Component\Mercure\HubInterface;
use Symfony\Component\Mercure\Update;

class RegattaNotificationService
{
	public function __construct(
		private HubInterface $hub,
		private WebPushService $webPushService
	) {}

	/**
	 * Envoie une notification (Mercure + Web Push) pour un nouveau document dans une régate
	 * 
	 * @param string $token Token d'accès de la régate
	 * @param string $documentName Nom du document uploadé
	 * @param string $category Catégorie du document
	 */
	public function notifyNewDocument(string $token, string $documentName, string $category): void
	{
		// Créer le topic spécifique à cette régate
		$topic = sprintf('/regatta/%s/documents', $token);

		// Créer les données du message
		$data = json_encode([
			'type' => 'new_document',
			'document' => [
				'name' => $documentName,
				'category' => $category,
			],
			'timestamp' => time(),
		]);

		// 1. Publier vers Mercure (pour les utilisateurs connectés)
		$update = new Update(
			topics: [$topic],
			data: $data,
			private: false
		);
		$this->hub->publish($update);

		// 2. Envoyer les notifications push (pour les utilisateurs mobiles)
		try {
			$this->webPushService->sendNotification(
				regattaToken: $token,
				title: 'Nouveau document disponible',
				body: sprintf('"%s" dans %s', $documentName, $category),
				data: [
					'type' => 'new_document',
					'document' => $documentName,
					'category' => $category,
					'url' => '/r/' . $token,
				]
			);
		} catch (\Exception $e) {
			// Log l'erreur mais ne bloque pas le processus
			error_log('Web Push error: ' . $e->getMessage());
		}
	}
}
