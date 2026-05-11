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

	/** @var array<int, true> IDs currently being normalized (prevents recursion) */
	private static array $normalizing = [];

	public function __construct(
		private UrlGeneratorInterface $urlGenerator
	) {}

	public function normalize($object, ?string $format = null, array $context = []): array
	{
		/** @var Document $object */
		$id = $object->getId();
		self::$normalizing[$id] = true;

		$data = $this->normalizer->normalize($object, $format, $context);

		unset(self::$normalizing[$id]);

		if ($object->getId() !== null) {
			try {
				$data['downloadUrl'] = $this->urlGenerator->generate(
					'api_documents_download',
					['id' => $id],
					UrlGeneratorInterface::ABSOLUTE_URL
				);
			} catch (\Exception) {
				// route non disponible dans ce contexte
			}
		}

		$data['formattedSize'] = $object->getFormattedSize();

		return $data;
	}

	public function supportsNormalization($data, ?string $format = null, array $context = []): bool
	{
		if (!$data instanceof Document) {
			return false;
		}

		$id = $data->getId();

		return $id === null || !isset(self::$normalizing[$id]);
	}

	public function getSupportedTypes(?string $format): array
	{
		return [
			Document::class => false, // false = not cacheable (stateful guard)
		];
	}
}
