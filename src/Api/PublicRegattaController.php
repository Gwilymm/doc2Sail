<?php

namespace App\Api;

use App\Entity\Document;
use App\Repository\RegattaRepository;
use App\Service\DocumentUploader;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\ResponseHeaderBag;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Routing\Generator\UrlGeneratorInterface;

class PublicRegattaController extends AbstractController
{
	public function __construct(
		private RegattaRepository $regattaRepository,
		private UrlGeneratorInterface $urlGenerator,
		private DocumentUploader $documentUploader,
	) {}

	#[Route('/r/{token}/data', name: 'api_public_regatta_data', methods: ['GET'])]
	public function data(string $token, Request $request): JsonResponse
	{
		$regatta = $this->regattaRepository->findOneBy(['accessToken' => $token]);

		if (!$regatta) {
			return $this->json(['error' => 'Cette régate n\'existe pas ou n\'est plus accessible.'], 404);
		}

		$documents = [];
		foreach ($regatta->getDocuments() as $document) {
			$documents[] = [
				'id' => $document->getId(),
				'name' => $document->getName(),
				'description' => $document->getDescription(),
				'filename' => $document->getFilename(),
				'mimeType' => $document->getMimeType(),
				'size' => $document->getSize() ?? 0,
				'formattedSize' => $document->getFormattedSize(),
				'category' => $document->getCategory(),
				'uploadedAt' => $document->getUploadedAt()?->format(\DateTimeInterface::ATOM) ?? '',
				'fileExists' => $this->documentUploader->exists(
					$document->getFilename(),
					$document->getRegatta()?->getId()
				),
				'viewUrl' => $this->documentUrl('api_public_document_file', $token, $document),
				'fileUrl' => $this->documentUrl('api_public_document_file', $token, $document),
				'downloadUrl' => $this->documentUrl('api_public_document_download', $token, $document),
			];
		}

		usort($documents, function (array $a, array $b): int {
			$categoryA = array_search($a['category'], Document::AVAILABLE_CATEGORIES, true);
			$categoryB = array_search($b['category'], Document::AVAILABLE_CATEGORIES, true);
			$categoryA = $categoryA === false ? PHP_INT_MAX : $categoryA;
			$categoryB = $categoryB === false ? PHP_INT_MAX : $categoryB;

			return $categoryA <=> $categoryB ?: strcmp((string) $a['name'], (string) $b['name']);
		});

		return $this->json([
			'id' => $regatta->getId(),
			'name' => $regatta->getName(),
			'startDate' => $regatta->getStartDate()?->format('Y-m-d'),
			'endDate' => $regatta->getEndDate()?->format('Y-m-d'),
			'description' => $regatta->getDescription(),
			'accessToken' => $regatta->getAccessToken(),
			'publicUrl' => $request->getSchemeAndHttpHost() . '/r/' . $token,
			'owner' => [
				'id' => $regatta->getOwner()?->getId(),
				'displayName' => $regatta->getOwner()?->getDisplayName(),
			],
			'documents' => $documents,
		]);
	}

	#[Route('/r/{token}', name: 'api_public_regatta_redirect', methods: ['GET'])]
	public function redirectToWebPublicView(string $token): RedirectResponse
	{
		return $this->redirectToRoute('app_regatta_public', [
			'_locale' => 'fr',
			'token' => $token,
		]);
	}

	#[Route('/r/{token}/document/{id}/file', name: 'api_public_document_file', methods: ['GET'])]
	public function serveFile(string $token, Document $document): BinaryFileResponse
	{
		$this->denyPublicDocumentAccess($token, $document);

		$response = new BinaryFileResponse($this->documentPath($document));
		$response->setContentDisposition(ResponseHeaderBag::DISPOSITION_INLINE, (string) $document->getName());

		return $response;
	}

	#[Route('/r/{token}/document/{id}/download', name: 'api_public_document_download', methods: ['GET'])]
	public function download(string $token, Document $document): BinaryFileResponse
	{
		$this->denyPublicDocumentAccess($token, $document);

		$response = new BinaryFileResponse($this->documentPath($document));
		$response->setContentDisposition(ResponseHeaderBag::DISPOSITION_ATTACHMENT, (string) $document->getName());

		return $response;
	}

	private function documentUrl(string $route, string $token, Document $document): string
	{
		return $this->urlGenerator->generate(
			$route,
			['token' => $token, 'id' => $document->getId()],
			UrlGeneratorInterface::ABSOLUTE_URL
		);
	}

	private function denyPublicDocumentAccess(string $token, Document $document): void
	{
		$regatta = $document->getRegatta();
		if (!$regatta || !hash_equals((string) $regatta->getAccessToken(), $token)) {
			throw $this->createNotFoundException('Document non trouvé');
		}
	}

	private function documentPath(Document $document): string
	{
		$filePath = $this->getParameter('kernel.project_dir') . '/public/' . $document->getFilePath();

		if (!file_exists($filePath)) {
			throw $this->createNotFoundException('Fichier non trouvé');
		}

		return $filePath;
	}
}
