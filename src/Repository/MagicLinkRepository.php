<?php

namespace App\Repository;

use App\Entity\MagicLink;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class MagicLinkRepository extends ServiceEntityRepository
{
	public function __construct(ManagerRegistry $registry)
	{
		parent::__construct($registry, MagicLink::class);
	}

	public function findValidToken(string $token): ?MagicLink
	{
		return $this->createQueryBuilder('ml')
			->where('ml.token = :token')
			->andWhere('ml.used = false')
			->andWhere('ml.expiresAt > :now')
			->setParameter('token', $token)
			->setParameter('now', new \DateTimeImmutable())
			->getQuery()
			->getOneOrNullResult();
	}

	/**
	 * Nettoie les liens expirés ou utilisés (plus de 1 jour)
	 */
	public function cleanupOldLinks(): int
	{
		$yesterday = new \DateTimeImmutable('-1 day');

		return $this->createQueryBuilder('ml')
			->delete()
			->where('ml.createdAt < :yesterday')
			->setParameter('yesterday', $yesterday)
			->getQuery()
			->execute();
	}
}
