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
			->andWhere('ml.useCount < ml.maxUses')
			->setParameter('token', $token)
			->setParameter('now', new \DateTimeImmutable())
			->getQuery()
			->getOneOrNullResult();
	}

	/**
	 * Trouve un magic link valide par code court (hash)
	 */
	public function findByShortCode(string $shortCode): ?MagicLink
	{
		$shortCodeHash = hash('sha256', strtoupper($shortCode));

		return $this->createQueryBuilder('ml')
			->where('ml.shortCodeHash = :hash')
			->andWhere('ml.used = false')
			->andWhere('ml.expiresAt > :now')
			->andWhere('ml.useCount < ml.maxUses')
			->setParameter('hash', $shortCodeHash)
			->setParameter('now', new \DateTimeImmutable())
			->getQuery()
			->getOneOrNullResult();
	}

	/**
	 * Compte les magic links actifs pour un utilisateur (anti-spam)
	 */
	public function countActiveLinksForUser(int $userId): int
	{
		return (int) $this->createQueryBuilder('ml')
			->select('COUNT(ml.id)')
			->where('ml.user = :userId')
			->andWhere('ml.used = false')
			->andWhere('ml.expiresAt > :now')
			->setParameter('userId', $userId)
			->setParameter('now', new \DateTimeImmutable())
			->getQuery()
			->getSingleScalarResult();
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

	/**
	 * Invalide tous les magic links actifs d'un utilisateur
	 * (appelé avant de créer un nouveau magic link)
	 */
	public function invalidateUserActiveLinks(int $userId): int
	{
		return $this->createQueryBuilder('ml')
			->update()
			->set('ml.used', 'true')
			->where('ml.user = :userId')
			->andWhere('ml.used = false')
			->andWhere('ml.expiresAt > :now')
			->setParameter('userId', $userId)
			->setParameter('now', new \DateTimeImmutable())
			->getQuery()
			->execute();
	}
}
