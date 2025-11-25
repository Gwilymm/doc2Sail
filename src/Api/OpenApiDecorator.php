<?php

namespace App\Api;

use ApiPlatform\OpenApi\Factory\OpenApiFactoryInterface;
use ApiPlatform\OpenApi\OpenApi;
use ApiPlatform\OpenApi\Model;

final class OpenApiDecorator implements OpenApiFactoryInterface
{
	public function __construct(
		private OpenApiFactoryInterface $decorated
	) {}

	public function __invoke(array $context = []): OpenApi
	{
		$openApi = ($this->decorated)($context);
		$paths = $openApi->getPaths();

		// Ajouter le schéma de sécurité JWT Bearer
		$securitySchemes = $openApi->getComponents()->getSecuritySchemes() ?? [];
		$securitySchemes['bearerAuth'] = new \ArrayObject([
			'type' => 'http',
			'scheme' => 'bearer',
			'bearerFormat' => 'JWT',
			'description' => 'JWT Token (obtenu via /api/login)',
		]);

		$components = $openApi->getComponents();
		$components = $components->withSecuritySchemes($securitySchemes);

		// Endpoint GET /api/me
		$pathItem = new Model\PathItem(
			ref: 'Me',
			get: new Model\Operation(
				operationId: 'getMe',
				tags: ['User'],
				responses: [
					'200' => [
						'description' => 'Données de l\'utilisateur connecté',
						'content' => [
							'application/json' => [
								'schema' => [
									'type' => 'object',
									'properties' => [
										'id' => ['type' => 'integer'],
										'displayName' => ['type' => 'string', 'nullable' => true],
										'roles' => ['type' => 'array', 'items' => ['type' => 'string']],
										'createdAt' => ['type' => 'string', 'format' => 'date-time'],
										'lastLoginAt' => ['type' => 'string', 'format' => 'date-time', 'nullable' => true],
										'regattasCount' => ['type' => 'integer'],
										'sharedRegattasCount' => ['type' => 'integer'],
									],
								],
							],
						],
					],
					'401' => ['description' => 'Non authentifié'],
				],
				summary: 'Récupérer les données de l\'utilisateur connecté',
				security: [['bearerAuth' => []]],
			),
		);
		$paths->addPath('/api/me', $pathItem);

		// Endpoint POST /api/notifications/read
		$pathItem = new Model\PathItem(
			ref: 'NotificationRead',
			post: new Model\Operation(
				operationId: 'markNotificationAsRead',
				tags: ['Notification'],
				responses: [
					'200' => [
						'description' => 'Notification marquée comme lue',
						'content' => [
							'application/json' => [
								'schema' => [
									'type' => 'object',
									'properties' => [
										'success' => ['type' => 'boolean'],
										'message' => ['type' => 'string'],
										'notificationId' => ['type' => 'integer'],
									],
								],
							],
						],
					],
					'400' => ['description' => 'Données invalides'],
					'401' => ['description' => 'Non authentifié'],
				],
				summary: 'Marquer une notification comme lue',
				requestBody: new Model\RequestBody(
					description: 'ID de la notification',
					content: new \ArrayObject([
						'application/json' => [
							'schema' => [
								'type' => 'object',
								'properties' => [
									'notificationId' => ['type' => 'integer'],
								],
								'required' => ['notificationId'],
							],
						],
					]),
				),
				security: [['bearerAuth' => []]],
			),
		);
		$paths->addPath('/api/notifications/read', $pathItem);

		// Endpoint GET /api/documents/{id}/download
		$pathItem = new Model\PathItem(
			ref: 'DocumentDownload',
			get: new Model\Operation(
				operationId: 'downloadDocument',
				tags: ['Document'],
				responses: [
					'200' => [
						'description' => 'Fichier téléchargé',
						'content' => [
							'application/octet-stream' => [
								'schema' => [
									'type' => 'string',
									'format' => 'binary',
								],
							],
						],
					],
					'404' => ['description' => 'Document non trouvé'],
				],
				summary: 'Télécharger un document',
				parameters: [
					new Model\Parameter(
						name: 'id',
						in: 'path',
						required: true,
						schema: ['type' => 'integer'],
					),
				],
			),
		);
		$paths->addPath('/api/documents/{id}/download', $pathItem);

		// Mettre à jour les components avec le schéma de sécurité
		$openApi = $openApi->withComponents($components);

		return $openApi;
	}
}
