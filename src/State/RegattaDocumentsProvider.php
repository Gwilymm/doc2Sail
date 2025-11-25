<?php

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProviderInterface;
use App\Entity\Document;
use App\Entity\Regatta;
use Doctrine\ORM\EntityManagerInterface;
use ApiPlatform\State\Pagination\TraversablePaginator;
use ApiPlatform\State\Pagination\PaginatorInterface;

class RegattaDocumentsProvider implements ProviderInterface
{
	public function __construct(
		private EntityManagerInterface $entityManager
	) {}

	public function provide(Operation $operation, array $uriVariables = [], array $context = []): object|array|null
	{
		$regattaId = $uriVariables['regattaId'] ?? null;

		if (!$regattaId) {
			return [];
		}

		$regatta = $this->entityManager->getRepository(Regatta::class)->find($regattaId);

		if (!$regatta) {
			return [];
		}

		$qb = $this->entityManager->getRepository(Document::class)
			->createQueryBuilder('d')
			->where('d.regatta = :regatta')
			->setParameter('regatta', $regatta)
			->orderBy('d.uploadedAt', 'DESC');

		// Pagination
		$page = $context['filters']['page'] ?? 1;
		$itemsPerPage = 30;
		$firstResult = ($page - 1) * $itemsPerPage;

		$query = $qb->getQuery()
			->setFirstResult($firstResult)
			->setMaxResults($itemsPerPage);

		$documents = $query->getResult();

		// Compter le total
		$totalItems = (int) $this->entityManager->getRepository(Document::class)
			->createQueryBuilder('d')
			->select('COUNT(d.id)')
			->where('d.regatta = :regatta')
			->setParameter('regatta', $regatta)
			->getQuery()
			->getSingleScalarResult();

		return new TraversablePaginator(
			new \ArrayIterator($documents),
			$page,
			$itemsPerPage,
			$totalItems
		);
	}
}
