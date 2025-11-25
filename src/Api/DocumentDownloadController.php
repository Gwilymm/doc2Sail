<?php

namespace App\Api;

use App\Entity\Document;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\ResponseHeaderBag;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

#[Route('/api', name: 'api_')]
class DocumentDownloadController extends AbstractController
{
	#[Route('/documents/{id}/download', name: 'documents_download', methods: ['GET'])]
	public function download(int $id, EntityManagerInterface $em): BinaryFileResponse
	{
		$document = $em->getRepository(Document::class)->find($id);

		if (!$document) {
			throw new NotFoundHttpException('Document non trouvé');
		}

		$filePath = $this->getParameter('kernel.project_dir') . '/public/' . $document->getFilePath();

		if (!file_exists($filePath)) {
			throw new NotFoundHttpException('Fichier non trouvé');
		}

		$response = new BinaryFileResponse($filePath);
		$response->setContentDisposition(
			ResponseHeaderBag::DISPOSITION_ATTACHMENT,
			$document->getName()
		);

		return $response;
	}
}
