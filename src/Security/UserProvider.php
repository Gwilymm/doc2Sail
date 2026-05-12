<?php

namespace App\Security;

use App\Entity\User;
use App\Repository\UserRepository;
use Psr\Log\LoggerInterface;
use Symfony\Component\Security\Core\Exception\UnsupportedUserException;
use Symfony\Component\Security\Core\Exception\UserNotFoundException;
use Symfony\Component\Security\Core\User\UserInterface;
use Symfony\Component\Security\Core\User\UserProviderInterface;

class UserProvider implements UserProviderInterface
{
	public function __construct(
		private UserRepository $userRepository,
		private LoggerInterface $logger,
	) {}

	/**
	 * Symfony appelle cette méthode si vous utilisez des fonctionnalités comme switch_user
	 * ou remember_me. Si vous ne les utilisez pas, vous pouvez simplement renvoyer votre
	 * utilisateur fraîchement chargé depuis la base de données.
	 */
	public function refreshUser(UserInterface $user): UserInterface
	{
		if (!$user instanceof User) {
			throw new UnsupportedUserException(sprintf('Invalid user class "%s".', get_class($user)));
		}

		// Recharger l'utilisateur depuis la base de données
		$reloadedUser = $this->userRepository->find($user->getId());

		if (!$reloadedUser) {
			throw new UserNotFoundException(sprintf('User with ID "%s" could not be reloaded.', $user->getId()));
		}

		return $reloadedUser;
	}

	/**
	 * Indique à Symfony quelles classes d'utilisateur ce provider supporte
	 */
	public function supportsClass(string $class): bool
	{
		return User::class === $class || is_subclass_of($class, User::class);
	}

	/**
	 * Charge un utilisateur par son identifiant (l'ID dans notre cas)
	 */
	public function loadUserByIdentifier(string $identifier): UserInterface
	{
		$user = $this->userRepository->find($identifier);

		if (!$user) {
			$this->logger->debug('User provider could not load user by identifier.');
			throw new UserNotFoundException(sprintf('User with identifier "%s" not found.', $identifier));
		}

		$this->logger->debug('User provider loaded user by identifier.');

		return $user;
	}

	/**
	 * Méthode custom pour charger un utilisateur par email
	 */
	public function loadUserByEmail(string $email): ?User
	{
		return $this->userRepository->findByEmail($email);
	}
}
