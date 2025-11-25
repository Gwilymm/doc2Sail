<?php

namespace App\Serializer;

use App\Entity\Document;
use Symfony\Component\Routing\Generator\UrlGeneratorInterface;
use Symfony\Component\Serializer\Normalizer\NormalizerInterface;
use Symfony\Component\Serializer\Normalizer\NormalizerAwareInterface;
use Symfony\Component\Serializer\Normalizer\NormalizerAwareTrait;

class DocumentNormalizer implements NormalizerInterface, NormalizerAwareInterface
{
	use NormalizerAwareTrait;

	private const ALREADY_CALLED = 'DOCUMENT_NORMALIZER_ALREADY_CALLED';

	public function __construct(
		private UrlGeneratorInterface $urlGenerator
	) {}

	public function normalize($object, ?string $format = null, array $context = []): array
	{
		/** @var Document $object */
		$context[self::ALREADY_CALLED] = true;

		$data = $this->normalizer->normalize($object, $format, $context);

		// Ajouter le lien de téléchargement
		$data['downloadUrl'] = $this->urlGenerator->generate(
			'api_documents_download',
			['id' => $object->getId()],
			UrlGeneratorInterface::ABSOLUTE_URL
		);

		// Ajouter la taille formatée
		$data['formattedSize'] = $object->getFormattedSize();

		return $data;
	}

	public function supportsNormalization($data, ?string $format = null, array $context = []): bool
	{
		// Éviter la récursion infinie
		if (isset($context[self::ALREADY_CALLED])) {
			return false;
		}

		return $data instanceof Document;
	}

	public function getSupportedTypes(?string $format): array
	{
		return [
			Document::class => true,
		];
	}
}
