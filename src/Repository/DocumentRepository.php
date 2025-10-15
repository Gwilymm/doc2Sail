<?php

namespace App\Repository;

use App\Entity\Document;
use App\Entity\Regatta;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Document>
 */
class DocumentRepository extends ServiceEntityRepository
{
	public function __construct(ManagerRegistry $registry)
	{
		parent::__construct($registry, Document::class);
	}

	/**
	 * Récupère tous les documents triés par date (plus récent en premier)
	 */
	public function findAllOrderedByDate(): array
	{
		return $this->createQueryBuilder('d')
			->orderBy('d.uploadedAt', 'DESC')
			->getQuery()
			->getResult();
	}

	/**
	 * Recherche des documents par nom ou description
	 */
	public function search(string $query): array
	{
		return $this->createQueryBuilder('d')
			->where('d.name LIKE :query')
			->orWhere('d.description LIKE :query')
			->setParameter('query', '%' . $query . '%')
			->orderBy('d.uploadedAt', 'DESC')
			->getQuery()
			->getResult();
	}

	public function findByRegattaSorted(Regatta $regatta): array
	{
		return $this->createQueryBuilder('d')
			->andWhere('d.regatta = :regatta')
			->setParameter('regatta', $regatta)
			->orderBy('d.category', 'ASC')
			->addOrderBy('d.name', 'ASC')
			->getQuery()
			->getResult();
	}
}
