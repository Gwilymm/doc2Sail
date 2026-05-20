<?php

namespace App\Repository;

use App\Entity\Regatta;
use App\Entity\RegattaShare;
use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<RegattaShare>
 */
class RegattaShareRepository extends ServiceEntityRepository
{
	public function __construct(ManagerRegistry $registry)
	{
		parent::__construct($registry, RegattaShare::class);
	}

	public function existsFor(User $user, Regatta $regatta): bool
	{
		return $this->findOneBy(['user' => $user, 'regatta' => $regatta]) !== null;
	}

	public function countForUser(User $user): int
	{
		return (int) $this->createQueryBuilder('share')
			->select('COUNT(share.id)')
			->andWhere('share.user = :user')
			->setParameter('user', $user)
			->getQuery()
			->getSingleScalarResult();
	}
}
