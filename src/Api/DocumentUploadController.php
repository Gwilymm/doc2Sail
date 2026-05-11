<?php

namespace App\Api;

use App\Entity\Document;
use App\Entity\Regatta;
use App\Service\DocumentUploader;
use App\Service\RegattaNotificationService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Validator\Validator\ValidatorInterface;

class DocumentUploadController extends AbstractController
{
	public function __construct(
		private EntityManagerInterface $entityManager,
		private DocumentUploader $documentUploader,
		private ValidatorInterface $validator,
		private RegattaNotificationService $notificationService,
	) {}

	public function __invoke(Request $request): JsonResponse
	{
		/** @var UploadedFile|null $file */
		$file = $request->files->get('file');
		if (!$file) {
			return $this->json(['error' => 'Aucun fichier fourni'], 400);
		}

		$regattaId = $request->request->get('regattaId') ?? $request->request->get('regatta_id');
		if (!$regattaId) {
			return $this->json(['error' => 'La régate est obligatoire'], 400);
		}

		$regatta = $this->entityManager->getRepository(Regatta::class)->find((int) $regattaId);
		if (!$regatta) {
			return $this->json(['error' => 'Régate introuvable'], 404);
		}

		$this->denyAccessUnlessGranted('REGATTA_EDIT', $regatta);

		$document = (new Document())
			->setName($request->request->get('name') ?: $file->getClientOriginalName())
			->setDescription($request->request->get('description'))
			->setCategory($request->request->get('category') ?: Document::DEFAULT_CATEGORY)
			->setRegatta($regatta)
			->setFile($file);

		$errors = $this->validator->validate($document);
		if (count($errors) > 0) {
			$messages = [];
			foreach ($errors as $error) {
				$messages[] = $error->getMessage();
			}

			return $this->json(['error' => implode(', ', $messages)], 400);
		}

		$uploadResult = $this->documentUploader->upload($file, $regatta->getId());
		$document
			->setFilename($uploadResult['filename'])
			->setMimeType($uploadResult['mimeType'])
			->setSize($uploadResult['size']);

		$this->entityManager->persist($document);
		$this->entityManager->flush();

		try {
			$this->notificationService->notifyNewDocument(
				$regatta->getAccessToken(),
				$document->getName(),
				$document->getCategory()
			);
		} catch (\Throwable) {
			// Realtime notifications are best-effort; upload success should not depend on Mercure.
		}

		return $this->json([
			'id' => $document->getId(),
			'name' => $document->getName(),
			'description' => $document->getDescription(),
			'filename' => $document->getFilename(),
			'mimeType' => $document->getMimeType(),
			'size' => $document->getSize(),
			'uploadedAt' => $document->getUploadedAt()?->format(\DateTimeInterface::ATOM),
			'category' => $document->getCategory(),
		], 201);
	}
}
