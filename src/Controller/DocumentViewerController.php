<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use App\Repository\DocumentRepository;
use Symfony\Component\Routing\Generator\UrlGeneratorInterface;

class DocumentViewerController extends AbstractController
{
	#[Route('/document/{id}/viewer', name: 'app_document_viewer')]
	public function viewer(Request $request, DocumentRepository $documents, int $id, UrlGeneratorInterface $urlGenerator): Response
	{
		$document = $documents->find($id);
		if (! $document) {
			throw $this->createNotFoundException('Document not found');
		}

		// The PDF URL is passed as a query parameter `file` (encoded)
		$file = $request->query->get('file');
		if (! $file) {
			// Fallback: if the document entity exposes a public URL method (adjust as needed)
			if (method_exists($document, 'getPublicUrl')) {
				$file = $document->getPublicUrl();
			}
			// If still missing, try to generate a direct link to the file route
			if (! $file) {
				$file = $urlGenerator->generate('app_document_file', ['id' => $document->getId()], UrlGeneratorInterface::ABSOLUTE_URL);
			}
		}

		if (! $file) {
			throw $this->createNotFoundException('File URL missing');
		}

		return $this->render('document/viewer.html.twig', [
			'document' => $document,
			'fileUrl' => $file,
			'downloadUrl' => $file,
		]);
	}
}
