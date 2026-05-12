<?php

namespace App\Security\Voter;

use App\Entity\Regatta;
use App\Entity\User;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Authorization\Voter\Vote;
use Symfony\Component\Security\Core\Authorization\Voter\Voter;

class RegattaVoter extends Voter
{
	public const VIEW = 'REGATTA_VIEW';
	public const EDIT = 'REGATTA_EDIT';
	public const DELETE = 'REGATTA_DELETE';

	protected function supports(string $attribute, mixed $subject): bool
	{
		return in_array($attribute, [self::VIEW, self::EDIT, self::DELETE])
			&& $subject instanceof Regatta;
	}

	protected function voteOnAttribute(string $attribute, mixed $subject, TokenInterface $token, ?Vote $vote = null): bool
	{
		$user = $token->getUser();

		// Si l'utilisateur n'est pas connecté, deny l'accès pour les opérations non-publiques
		if (!$user instanceof User) {
			return false;
		}

		/** @var Regatta $regatta */
		$regatta = $subject;

		return match ($attribute) {
			self::VIEW => $this->canView($regatta, $user),
			self::EDIT => $this->canEdit($regatta, $user),
			self::DELETE => $this->canDelete($regatta, $user),
			default => false,
		};
	}

	private function canView(Regatta $regatta, User $user): bool
	{
		return $regatta->canManage($user);
	}

	private function canEdit(Regatta $regatta, User $user): bool
	{
		// Le propriétaire et les co-propriétaires peuvent éditer
		return $regatta->canManage($user);
	}

	private function canDelete(Regatta $regatta, User $user): bool
	{
		// Seul le propriétaire peut supprimer
		return $regatta->getOwner() === $user;
	}
}
