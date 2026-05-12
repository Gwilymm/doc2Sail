<?php

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProviderInterface;
use App\Entity\Document;
use App\Entity\Regatta;
use Doctrine\ORM\EntityManagerInterface;
use ApiPlatform\State\Pagination\TraversablePaginator;
use Symfony\Component\Security\Core\Authorization\AuthorizationCheckerInterface;
use Symfony\Component\Security\Core\Exception\AccessDeniedException;

class RegattaDocumentsProvider implements ProviderInterface
{
	public function __construct(
		private EntityManagerInterface $entityManager,
		private AuthorizationCheckerInterface $authorizationChecker,
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

		if (!$this->authorizationChecker->isGranted('REGATTA_VIEW', $regatta)) {
			throw new AccessDeniedException('Vous n\'avez pas accès à cette régate.');
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
