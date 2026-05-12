<?php

namespace App\Controller;

use App\Entity\Document;
use App\Entity\Regatta;
use App\Repository\DocumentRepository;
use App\Service\DocumentUploader;
use App\Service\RegattaNotificationService;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\LoggerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Routing\Generator\UrlGeneratorInterface;
use Symfony\Component\Security\Core\Exception\AccessDeniedException;
use Symfony\Component\Validator\Validator\ValidatorInterface;

class DocumentController extends AbstractController
{
	public function __construct(
		private EntityManagerInterface $entityManager,
		private DocumentRepository $documentRepository,
		private DocumentUploader $documentUploader,
		private ValidatorInterface $validator,
		private RegattaNotificationService $notificationService,
		private LoggerInterface $logger,
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


			if (!$file) {
				return new JsonResponse(['error' => 'Aucun fichier fourni'], 400);
			}

			if (!$regattaId) {
				return new JsonResponse(['error' => 'La régate est obligatoire'], 400);
			}

			$regatta = $this->entityManager->getRepository(Regatta::class)->find((int) $regattaId);
			if (!$regatta) {
				return new JsonResponse(['error' => 'Régate introuvable'], 404);
			}

			$this->denyAccessUnlessGranted('REGATTA_EDIT', $regatta);

			// Créer l'entité Document
			$document = new Document();
			$document->setName($name ?: $file->getClientOriginalName());
			$document->setDescription($description);
			// Si la catégorie est vide, utiliser la valeur par défaut
			$document->setCategory($category ?: Document::DEFAULT_CATEGORY);
			$document->setFile($file);
			$document->setRegatta($regatta);
			error_log("Document linked to regatta: " . $regatta->getName());



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
		} catch (AccessDeniedException $e) {
			throw $e;
		} catch (\Exception $e) {
			$this->logger->error('Upload failed', ['exception' => $e]);

			return new JsonResponse([
				'error' => 'Une erreur est survenue lors de l\'upload du document.'
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

	#[Route('/document/{id}/file', name: 'app_document_file')]
	public function serveInline(Document $document): BinaryFileResponse
	{
		$filePath = $this->getParameter('kernel.project_dir') . '/public/' . $document->getFilePath();

		if (!file_exists($filePath)) {
			throw $this->createNotFoundException('Fichier non trouvé');
		}

		// Retourner en inline pour l'iframe / viewer
		return parent::file($filePath)->setContentDisposition('inline', $document->getName());
	}

	#[Route('/document/{id}/view', name: 'app_document_view')]
	public function view(Document $document): Response
	{
		// URLs publiques
		$fileUrl = $this->generateUrl(
			'app_document_file',
			['id' => $document->getId()],
			UrlGeneratorInterface::ABSOLUTE_URL
		);

		$downloadUrl = $this->generateUrl(
			'app_document_download',
			['id' => $document->getId()],
			UrlGeneratorInterface::ABSOLUTE_URL
		);

		// Types détectés
		$mime = (string) $document->getMimeType();
		$extension = strtolower(pathinfo($document->getFilename(), PATHINFO_EXTENSION));

		$isImage  = str_starts_with($mime, 'image/');
		$isPdf    = $mime === 'application/pdf';
		$isOffice = in_array($extension, ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx']);
		$isTxt    = in_array($extension, ['txt', 'md', 'json', 'csv', 'log']);

		// Lecture TXT
		$txtContent = null;
		if ($isTxt) {
			// Construction du chemin physique EXACT
			$absolutePath = $_SERVER['DOCUMENT_ROOT']
				. '/uploads/documents/'
				. $document->getId()
				. '/'
				. $document->getFilename();

			if (is_readable($absolutePath)) {
				$txtContent = file_get_contents($absolutePath);
			}
		}

		return $this->render('document/view.html.twig', [
			'document'     => $document,
			'fileUrl'      => $fileUrl,
			'downloadUrl'  => $downloadUrl,
			'isImage'      => $isImage,
			'isPdf'        => $isPdf,
			'isOffice'     => $isOffice,
			'isTxt'        => $isTxt,
			'txtContent'   => $txtContent,
		]);
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
