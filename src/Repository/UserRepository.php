<?php

namespace App\Repository;

use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class UserRepository extends ServiceEntityRepository
{
	public function __construct(ManagerRegistry $registry)
	{
		parent::__construct($registry, User::class);
	}

	/**
	 * Trouve un utilisateur par email (comparaison via password_verify)
	 * Note: Avec Argon2id, on doit récupérer tous les users et vérifier un par un
	 * car le hash change à chaque fois (salt aléatoire intégré)
	 */
	public function findByEmail(string $email): ?User
	{
		$normalizedEmail = strtolower(trim($email));
		$users = $this->findAll();

		foreach ($users as $user) {
			if ($user->verifyEmail($normalizedEmail)) {
				return $user;
			}
		}

		return null;
	}
	/**
	 * Trouve ou crée un utilisateur par email
	 */
	public function findOrCreateByEmail(string $email, ?string $displayName = null): User
	{
		$user = $this->findByEmail($email);

		if (!$user) {
			$user = new User();
			$user->setEmail($email);

			if ($displayName) {
				$user->setDisplayName($displayName);
			}

			$this->getEntityManager()->persist($user);
			$this->getEntityManager()->flush();
		}

		return $user;
	}
}
