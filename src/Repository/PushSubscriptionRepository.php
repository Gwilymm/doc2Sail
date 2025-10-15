<?php

namespace App\Repository;

use App\Entity\PushSubscription;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<PushSubscription>
 */
class PushSubscriptionRepository extends ServiceEntityRepository
{
	public function __construct(ManagerRegistry $registry)
	{
		parent::__construct($registry, PushSubscription::class);
	}

	/**
	 * Trouve un abonnement par son endpoint
	 */
	public function findByEndpoint(string $endpoint): ?PushSubscription
	{
		return $this->findOneBy(['endpoint' => $endpoint]);
	}

	/**
	 * Trouve tous les abonnements pour une régate donnée
	 */
	public function findByRegattaToken(string $token): array
	{
		return $this->findBy(['regattaToken' => $token]);
	}

	/**
	 * Supprime les abonnements inactifs (plus de 90 jours)
	 */
	public function removeInactive(): int
	{
		$date = new \DateTime('-90 days');

		return $this->createQueryBuilder('ps')
			->delete()
			->where('ps.lastUsedAt < :date OR ps.lastUsedAt IS NULL')
			->andWhere('ps.createdAt < :date')
			->setParameter('date', $date)
			->getQuery()
			->execute();
	}
}
