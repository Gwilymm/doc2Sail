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
			$this->logger->debug('Document linked to regatta before upload.', [
				'regatta_id' => $regatta->getId(),
			]);



			// Valider l'entité
			$errors = $this->validator->validate($document);

			if (count($errors) > 0) {
				$errorMessages = [];
				foreach ($errors as $error) {
					$errorMessages[] = $error->getMessage();
				}
				$this->logger->debug('Document upload validation failed.', [
					'regatta_id' => $regatta->getId(),
					'errors_count' => count($errorMessages),
				]);
				return new JsonResponse(['error' => implode(', ', $errorMessages)], 400);
			}

			$this->logger->debug('Document upload validation passed.', [
				'regatta_id' => $regatta->getId(),
			]);

			// Upload du fichier
			$this->logger->debug('Document file upload started.', [
				'regatta_id' => $regatta->getId(),
			]);
			$uploadResult = $this->documentUploader->upload($file, $regattaId ? (int)$regattaId : null);
			$this->logger->debug('Document file upload completed.', [
				'regatta_id' => $regatta->getId(),
			]);

			$document->setFilename($uploadResult['filename']);
			$document->setMimeType($uploadResult['mimeType']);
			$document->setSize($uploadResult['size']);

			// Sauvegarder en BDD
			$this->entityManager->persist($document);

			$this->entityManager->flush();

			$this->logger->info('document_uploaded', [
				'regatta_id' => $regatta->getId(),
				'document_id' => $document->getId(),
			]);

			// Envoyer la notification Mercure si le document est lié à une régate
			if ($document->getRegatta()) {
				try {
					$this->notificationService->notifyNewDocument(
						$document->getRegatta()->getAccessToken(),
						$document->getName(),
						$document->getCategory()
					);
					$this->logger->info('notification_sent', [
						'regatta_id' => $regatta->getId(),
					]);
				} catch (\Exception $e) {
					$this->logger->warning('notification_failed', [
						'regatta_id' => $regatta->getId(),
						'exception' => $e,
					]);
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
		$this->denyAccessUnlessGranted('REGATTA_VIEW', $this->getDocumentRegatta($document));

		return $this->downloadDocument($document);
	}

	#[Route('/document/{id}/file', name: 'app_document_file')]
	public function serveInline(Document $document): BinaryFileResponse
	{
		$this->denyAccessUnlessGranted('REGATTA_VIEW', $this->getDocumentRegatta($document));

		return $this->serveDocumentInline($document);
	}

	#[Route('/document/{id}/view', name: 'app_document_view')]
	public function view(Document $document): Response
	{
		$this->denyAccessUnlessGranted('REGATTA_VIEW', $this->getDocumentRegatta($document));

		return $this->renderDocumentView($document, 'app_document_file', 'app_document_download');
	}

	#[Route('/r/{token}/document/{id}/download', name: 'app_document_public_download')]
	public function publicDownload(string $token, Document $document): BinaryFileResponse
	{
		$this->denyPublicDocumentAccess($token, $document);

		return $this->downloadDocument($document);
	}

	#[Route('/r/{token}/document/{id}/file', name: 'app_document_public_file')]
	public function publicServeInline(string $token, Document $document): BinaryFileResponse
	{
		$this->denyPublicDocumentAccess($token, $document);

		return $this->serveDocumentInline($document);
	}

	#[Route('/r/{token}/document/{id}/view', name: 'app_document_public_view')]
	public function publicView(string $token, Document $document): Response
	{
		$this->denyPublicDocumentAccess($token, $document);

		return $this->renderDocumentView($document, 'app_document_public_file', 'app_document_public_download', ['token' => $token]);
	}




	#[Route('/document/{id}/delete', name: 'app_document_delete', methods: ['POST'])]
	public function delete(Document $document): JsonResponse
	{
		try {
			$regatta = $this->getDocumentRegatta($document);
			$this->denyAccessUnlessGranted('REGATTA_EDIT', $regatta);
			$regattaId = $regatta->getId();

			// Supprimer le fichier physique
			$this->documentUploader->delete($document->getFilename(), $regattaId);

			// Supprimer l'entrée en BDD
			$this->entityManager->remove($document);
			$this->entityManager->flush();

			return new JsonResponse([
				'success' => true,
				'message' => 'Document supprimé avec succès'
			]);
		} catch (AccessDeniedException $e) {
			throw $e;
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

	private function getDocumentRegatta(Document $document): Regatta
	{
		$regatta = $document->getRegatta();
		if (!$regatta) {
			throw $this->createNotFoundException('Document non trouvé');
		}

		return $regatta;
	}

	private function denyPublicDocumentAccess(string $token, Document $document): void
	{
		$regatta = $this->getDocumentRegatta($document);
		if (!hash_equals((string) $regatta->getAccessToken(), $token)) {
			throw $this->createNotFoundException('Document non trouvé');
		}
	}

	private function downloadDocument(Document $document): BinaryFileResponse
	{
		$filePath = $this->getDocumentPath($document);

		return $this->file($filePath, $document->getName());
	}

	private function serveDocumentInline(Document $document): BinaryFileResponse
	{
		$filePath = $this->getDocumentPath($document);

		return parent::file($filePath)->setContentDisposition('inline', $document->getName());
	}

	private function getDocumentPath(Document $document): string
	{
		$filePath = $this->getParameter('kernel.project_dir') . '/public/' . $document->getFilePath();

		if (!file_exists($filePath)) {
			throw $this->createNotFoundException('Fichier non trouvé');
		}

		return $filePath;
	}

	private function renderDocumentView(
		Document $document,
		string $fileRoute,
		string $downloadRoute,
		array $routeParameters = [],
	): Response {
		$routeParameters['id'] = $document->getId();

		$fileUrl = $this->generateUrl($fileRoute, $routeParameters, UrlGeneratorInterface::ABSOLUTE_URL);
		$downloadUrl = $this->generateUrl($downloadRoute, $routeParameters, UrlGeneratorInterface::ABSOLUTE_URL);

		$mime = (string) $document->getMimeType();
		$extension = strtolower(pathinfo($document->getFilename(), PATHINFO_EXTENSION));

		$isImage  = str_starts_with($mime, 'image/');
		$isPdf    = $mime === 'application/pdf';
		$isOffice = in_array($extension, ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx']);
		$isTxt    = in_array($extension, ['txt', 'md', 'json', 'csv', 'log']);

		$txtContent = null;
		if ($isTxt && is_readable($this->getDocumentPath($document))) {
			$txtContent = file_get_contents($this->getDocumentPath($document));
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
}
