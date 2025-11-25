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

		// Endpoint POST /api/auth/request - Demande de magic link
		$pathItem = new Model\PathItem(
			ref: 'AuthRequest',
			post: new Model\Operation(
				operationId: 'requestMagicLink',
				tags: ['Authentication'],
				responses: [
					'200' => [
						'description' => 'Code envoyé par email',
						'content' => [
							'application/json' => [
								'schema' => [
									'type' => 'object',
									'properties' => [
										'success' => ['type' => 'boolean'],
										'expiresIn' => ['type' => 'integer', 'description' => 'Secondes avant expiration'],
										'message' => ['type' => 'string'],
									],
								],
							],
						],
					],
					'400' => ['description' => 'Email invalide'],
					'429' => ['description' => 'Trop de demandes'],
				],
				summary: 'Demander un code de connexion par email',
				description: 'Envoie un code à 6 caractères par email pour authentification mobile',
				requestBody: new Model\RequestBody(
					description: 'Email et nom optionnel',
					content: new \ArrayObject([
						'application/json' => [
							'schema' => [
								'type' => 'object',
								'properties' => [
									'email' => ['type' => 'string', 'format' => 'email'],
									'displayName' => ['type' => 'string', 'nullable' => true],
								],
								'required' => ['email'],
							],
						],
					]),
				),
			),
		);
		$paths->addPath('/api/auth/request', $pathItem);

		// Endpoint POST /api/auth/verify - Vérification du code
		$pathItem = new Model\PathItem(
			ref: 'AuthVerify',
			post: new Model\Operation(
				operationId: 'verifyMagicLinkCode',
				tags: ['Authentication'],
				responses: [
					'200' => [
						'description' => 'Code valide, JWT retourné',
						'content' => [
							'application/json' => [
								'schema' => [
									'type' => 'object',
									'properties' => [
										'token' => ['type' => 'string', 'description' => 'JWT token'],
										'user' => [
											'type' => 'object',
											'properties' => [
												'id' => ['type' => 'integer'],
												'displayName' => ['type' => 'string', 'nullable' => true],
												'roles' => ['type' => 'array', 'items' => ['type' => 'string']],
											],
										],
									],
								],
							],
						],
					],
					'400' => ['description' => 'Code manquant'],
					'401' => ['description' => 'Code invalide ou expiré'],
				],
				summary: 'Vérifier un code de connexion',
				description: 'Vérifie le code à 6 caractères et retourne un JWT si valide',
				requestBody: new Model\RequestBody(
					description: 'Code de vérification',
					content: new \ArrayObject([
						'application/json' => [
							'schema' => [
								'type' => 'object',
								'properties' => [
									'code' => ['type' => 'string', 'minLength' => 6, 'maxLength' => 6, 'example' => 'ABC123'],
								],
								'required' => ['code'],
							],
						],
					]),
				),
			),
		);
		$paths->addPath('/api/auth/verify', $pathItem);

		// Mettre à jour les components avec le schéma de sécurité
		$openApi = $openApi->withComponents($components);

		return $openApi;
	}
}
