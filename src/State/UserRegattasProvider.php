<?php

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\Pagination\TraversablePaginator;
use ApiPlatform\State\ProviderInterface;
use App\Entity\Regatta;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\Security\Core\Exception\AccessDeniedException;

class UserRegattasProvider implements ProviderInterface
{
	public function __construct(
		private EntityManagerInterface $entityManager,
		private Security $security,
	) {}

	public function provide(Operation $operation, array $uriVariables = [], array $context = []): object|array|null
	{
		$user = $this->security->getUser();
		if (!$user instanceof User) {
			throw new AccessDeniedException('Vous devez être connecté.');
		}

		$page = max(1, (int) ($context['filters']['page'] ?? 1));
		$itemsPerPage = 20;
		$firstResult = ($page - 1) * $itemsPerPage;

		$qb = $this->entityManager->getRepository(Regatta::class)
			->createQueryBuilder('r')
			->leftJoin('r.coOwners', 'coOwner')
			->leftJoin(\App\Entity\RegattaShare::class, 'share', 'WITH', 'share.regatta = r AND share.user = :user')
			->where('r.owner = :user OR coOwner = :user OR share.user = :user')
			->setParameter('user', $user)
			->orderBy('r.startDate', 'DESC')
			->distinct();

		$regattas = (clone $qb)
			->setFirstResult($firstResult)
			->setMaxResults($itemsPerPage)
			->getQuery()
			->getResult();

		$totalItems = (int) (clone $qb)
			->select('COUNT(DISTINCT r.id)')
			->resetDQLPart('orderBy')
			->getQuery()
			->getSingleScalarResult();

		return new TraversablePaginator(
			new \ArrayIterator($regattas),
			$page,
			$itemsPerPage,
			$totalItems
		);
	}
}
