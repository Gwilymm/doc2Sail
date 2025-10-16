<?php

namespace App\Controller;

use App\Entity\Document;
use App\Entity\Regatta;
use App\Repository\DocumentRepository;
use App\Service\DocumentUploader;
use App\Service\RegattaNotificationService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Validator\Validator\ValidatorInterface;

class DocumentController extends AbstractController
{
	public function __construct(
		private EntityManagerInterface $entityManager,
		private DocumentRepository $documentRepository,
		private DocumentUploader $documentUploader,
		private ValidatorInterface $validator,
		private RegattaNotificationService $notificationService,
	) {}

	#[Route('/admin', name: 'app_documents_admin')]
	public function admin(): Response
	{
		// Rediriger vers la liste des régates
		return $this->redirectToRoute('app_regatta');
	}

	#[Route('/document/upload', name: 'app_document_upload', methods: ['POST'])]
	public function upload(Request $request): JsonResponse
	{
		try {
			/** @var UploadedFile $file */
			$file = $request->files->get('file');
			$name = $request->request->get('name');
			$description = $request->request->get('description');
			$category = $request->request->get('category');
			$regattaId = $request->request->get('regatta_id');

			error_log("=== UPLOAD DEBUG ===");
			error_log("File received: " . ($file ? 'YES' : 'NO'));
			error_log("Regatta ID: " . ($regattaId ?: 'NONE'));
			if ($file) {
				error_log("File name: " . $file->getClientOriginalName());
				error_log("File size: " . $file->getSize());
				error_log("File mime: " . $file->getClientMimeType());
				error_log("File error: " . $file->getError());
			}

			if (!$file) {
				return new JsonResponse(['error' => 'Aucun fichier fourni'], 400);
			}

			// Taille maximale autorisée (en octets) - correspond au message UI: 10MB
			$maxSize = 10 * 1024 * 1024;
			if ($file && $file->getSize() > $maxSize) {
				// Retourner un JSON clair avec le code 413 (Payload Too Large)
				return new JsonResponse(['error' => 'Fichier trop volumineux. Taille maximale : 10MB'], 413);
			}

			// Créer l'entité Document
			$document = new Document();
			$document->setName($name ?: $file->getClientOriginalName());
			$document->setDescription($description);
			// Si la catégorie est vide, utiliser la valeur par défaut
			$document->setCategory($category ?: Document::DEFAULT_CATEGORY);
			$document->setFile($file);			// Associer à une régate si spécifié
			if ($regattaId) {
				$regatta = $this->entityManager->getRepository(Regatta::class)->find($regattaId);
				if ($regatta) {
					$document->setRegatta($regatta);
					error_log("Document linked to regatta: " . $regatta->getName());
				}
			}

			error_log("Document entity created");
			error_log("Document category: " . $document->getCategory());

			// Valider l'entité
			$errors = $this->validator->validate($document);
			if (count($errors) > 0) {
				$errorMessages = [];
				foreach ($errors as $error) {
					$errorMessages[] = $error->getMessage();
				}
				error_log("Validation errors: " . implode(', ', $errorMessages));
				return new JsonResponse(['error' => implode(', ', $errorMessages)], 400);
			}

			error_log("Validation passed");

			// Upload du fichier
			error_log("Starting file upload...");
			$uploadResult = $this->documentUploader->upload($file, $regattaId ? (int)$regattaId : null);
			error_log("File uploaded: " . $uploadResult['filename']);

			$document->setFilename($uploadResult['filename']);
			$document->setMimeType($uploadResult['mimeType']);
			$document->setSize($uploadResult['size']);

			error_log("About to persist entity...");
			// Sauvegarder en BDD
			$this->entityManager->persist($document);

			error_log("About to flush...");
			$this->entityManager->flush();

			error_log("Document saved with ID: " . $document->getId());

			// Envoyer la notification Mercure si le document est lié à une régate
			if ($document->getRegatta()) {
				try {
					$this->notificationService->notifyNewDocument(
						$document->getRegatta()->getAccessToken(),
						$document->getName(),
						$document->getCategory()
					);
					error_log("Notification sent for regatta: " . $document->getRegatta()->getAccessToken());
				} catch (\Exception $e) {
					error_log("Notification error: " . $e->getMessage());
					// On ne bloque pas l'upload si la notification échoue
				}
			}

			return new JsonResponse([
				'success' => true,
				'message' => 'Document uploadé avec succès',
				'document' => [
					'id' => $document->getId(),
					'name' => $document->getName(),
					'size' => $document->getFormattedSize(),
					'uploadedAt' => $document->getUploadedAt()->format('d/m/Y H:i'),
					'category' => $document->getCategory(),
				]
			]);
		} catch (\Exception $e) {
			error_log("UPLOAD ERROR: " . $e->getMessage());
			error_log("Stack trace: " . $e->getTraceAsString());
			return new JsonResponse([
				'error' => $e->getMessage(),
				'trace' => $e->getTraceAsString()
			], 500);
		}
	}

	#[Route('/document/{id}/download', name: 'app_document_download')]
	public function download(Document $document): BinaryFileResponse
	{
		$filePath = $this->getParameter('kernel.project_dir') . '/public/' . $document->getFilePath();

		if (!file_exists($filePath)) {
			throw $this->createNotFoundException('Fichier non trouvé');
		}

		return $this->file($filePath, $document->getName());
	}

	#[Route('/document/{id}/view', name: 'app_document_view')]
	public function view(Document $document): BinaryFileResponse
	{
		$filePath = $this->getParameter('kernel.project_dir') . '/public/' . $document->getFilePath();

		if (!file_exists($filePath)) {
			throw $this->createNotFoundException('Fichier non trouvé');
		}

		return $this->file($filePath)->setContentDisposition('inline', $document->getName());
	}

	#[Route('/document/{id}/delete', name: 'app_document_delete', methods: ['POST'])]
	public function delete(Document $document): JsonResponse
	{
		try {
			$regattaId = $document->getRegatta() ? $document->getRegatta()->getId() : null;

			// Supprimer le fichier physique
			$this->documentUploader->delete($document->getFilename(), $regattaId);

			// Supprimer l'entrée en BDD
			$this->entityManager->remove($document);
			$this->entityManager->flush();

			return new JsonResponse([
				'success' => true,
				'message' => 'Document supprimé avec succès'
			]);
		} catch (\Exception $e) {
			return new JsonResponse(['error' => $e->getMessage()], 500);
		}
	}

	#[Route('/documents/search', name: 'app_documents_search')]
	public function search(Request $request): JsonResponse
	{
		$query = $request->query->get('q', '');

		if (empty($query)) {
			$documents = $this->documentRepository->findAllOrderedByDate();
		} else {
			$documents = $this->documentRepository->search($query);
		}

		$result = array_map(function (Document $doc) {
			return [
				'id' => $doc->getId(),
				'name' => $doc->getName(),
				'description' => $doc->getDescription(),
				'size' => $doc->getFormattedSize(),
				'mimeType' => $doc->getMimeType(),
				'uploadedAt' => $doc->getUploadedAt()->format('d/m/Y H:i'),
				'category' => $doc->getCategory(),
			];
		}, $documents);

		return new JsonResponse($result);
	}
}
