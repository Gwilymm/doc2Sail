<?php

namespace App\Repository;

use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Component\DependencyInjection\Attribute\Autowire;

class UserRepository extends ServiceEntityRepository
{
	public function __construct(
		ManagerRegistry $registry,
		#[Autowire('%env(APP_SECRET)%')]
		private string $appSecret,
	) {
		parent::__construct($registry, User::class);
	}

	/**
	 * Trouve un utilisateur par email via un index HMAC déterministe.
	 * Le hash Argon2id est conservé comme vérification de défense en profondeur.
	 */
	public function findByEmail(string $email): ?User
	{
		$normalizedEmail = strtolower(trim($email));
		$emailLookupHash = $this->hashEmailForLookup($normalizedEmail);

		$user = $this->findOneBy(['emailLookupHash' => $emailLookupHash]);
		if ($user) {
			return $user->verifyEmail($normalizedEmail) ? $user : null;
		}

		// Fallback transitoire pour les comptes créés avant l'ajout de emailLookupHash.
		$legacyUsers = $this->createQueryBuilder('u')
			->where('u.emailLookupHash IS NULL')
			->getQuery()
			->getResult();

		foreach ($legacyUsers as $user) {
			if ($user->verifyEmail($normalizedEmail)) {
				$user->setEmailLookupHash($emailLookupHash);
				$this->getEntityManager()->flush();

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
			$user->setEmailLookupHash($this->hashEmailForLookup($email));

			if ($displayName) {
				$user->setDisplayName($displayName);
			}

			$this->getEntityManager()->persist($user);
			$this->getEntityManager()->flush();
		}

		return $user;
	}

	private function hashEmailForLookup(string $email): string
	{
		return hash_hmac('sha256', strtolower(trim($email)), $this->appSecret);
	}
}
