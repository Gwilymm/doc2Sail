<?php

namespace App\Repository;

use App\Entity\RegattaInvitation;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<RegattaInvitation>
 */
class RegattaInvitationRepository extends ServiceEntityRepository
{
	public function __construct(ManagerRegistry $registry)
	{
		parent::__construct($registry, RegattaInvitation::class);
	}

	public function findValidToken(string $token): ?RegattaInvitation
	{
		return $this->createQueryBuilder('ri')
			->where('ri.token = :token')
			->andWhere('ri.used = false')
			->andWhere('ri.expiresAt > :now')
			->setParameter('token', $token)
			->setParameter('now', new \DateTimeImmutable())
			->getQuery()
			->getOneOrNullResult();
	}
}
