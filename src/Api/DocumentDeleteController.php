<?php

namespace App\Api;

use App\Entity\Document;
use App\Service\DocumentUploader;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

#[Route('/api', name: 'api_')]
class DocumentDeleteController extends AbstractController
{
	public function __construct(
		private EntityManagerInterface $entityManager,
		private DocumentUploader $documentUploader,
	) {}

	#[Route('/documents/{id}/delete', name: 'documents_delete', methods: ['DELETE'])]
	public function delete(int $id): JsonResponse
	{
		$document = $this->entityManager->getRepository(Document::class)->find($id);

		if (!$document) {
			throw new NotFoundHttpException('Document non trouvé');
		}

		$regatta = $document->getRegatta();
		if (!$regatta) {
			throw new NotFoundHttpException('Document non trouvé');
		}

		$this->denyAccessUnlessGranted('REGATTA_EDIT', $regatta);

		$this->documentUploader->delete((string) $document->getFilename(), $regatta->getId());
		$this->entityManager->remove($document);
		$this->entityManager->flush();

		return new JsonResponse([
			'success' => true,
			'message' => 'Document supprimé avec succès',
		], Response::HTTP_OK);
	}
}
