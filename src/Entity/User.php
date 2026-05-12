<?php

namespace App\Entity;

use App\Repository\UserRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Security\Core\User\UserInterface;
use Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface;
use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: UserRepository::class)]
#[ORM\Table(name: '`user`')]
class User implements UserInterface, PasswordAuthenticatedUserInterface
{
	#[ORM\Id]
	#[ORM\GeneratedValue]
	#[ORM\Column]
	#[Groups(['user:read', 'regatta:read'])]
	private ?int $id = null;

	#[ORM\Column(length: 255, unique: true)]
	private ?string $emailHash = null; // Email hashé (Argon2id)

	#[ORM\Column(length: 64, unique: true, nullable: true)]
	private ?string $emailLookupHash = null; // HMAC déterministe pour lookup O(1), jamais l'email clair

	#[ORM\Column(type: 'json')]
	#[Groups(['user:read'])]
	private array $roles = [];

	#[ORM\Column(length: 100, nullable: true)]
	#[Assert\Length(max: 100)]
	#[Assert\Regex(
		pattern: '/^[^\x00-\x1F\x7F]*$/u',
		message: 'Le nom d\'affichage ne peut pas contenir de caractères de contrôle.'
	)]
	#[Groups(['user:read', 'regatta:read'])]
	private ?string $displayName = null; // Nom d'affichage optionnel (ex: "Skipper Alpha")

	#[ORM\Column]
	#[Groups(['user:read'])]
	private ?\DateTimeImmutable $createdAt = null;

	#[ORM\Column(nullable: true)]
	#[Groups(['user:read'])]
	private ?\DateTimeImmutable $lastLoginAt = null;

	/**
	 * @var Collection<int, Regatta>
	 */
	#[ORM\OneToMany(targetEntity: Regatta::class, mappedBy: 'owner', cascade: ['persist', 'remove'])]
	private Collection $regattas;

	/**
	 * @var Collection<int, Regatta>
	 */
	#[ORM\ManyToMany(targetEntity: Regatta::class, mappedBy: 'coOwners')]
	private Collection $sharedRegattas;

	public function __construct()
	{
		$this->regattas = new ArrayCollection();
		$this->sharedRegattas = new ArrayCollection();
		$this->createdAt = new \DateTimeImmutable();
		$this->roles = ['ROLE_USER']; // Initialiser avec le rôle par défaut
	}

	public function getId(): ?int
	{
		return $this->id;
	}

	public function getEmailHash(): ?string
	{
		return $this->emailHash;
	}

	public function setEmailHash(string $emailHash): static
	{
		$this->emailHash = $emailHash;
		return $this;
	}

	public function getEmailLookupHash(): ?string
	{
		return $this->emailLookupHash;
	}

	public function setEmailLookupHash(?string $emailLookupHash): static
	{
		$this->emailLookupHash = $emailLookupHash;
		return $this;
	}

	/**
	 * Définir l'email (sera automatiquement hashé avec Argon2id)
	 */
	public function setEmail(string $email): static
	{
		$normalizedEmail = strtolower(trim($email));
		$this->emailHash = password_hash($normalizedEmail, PASSWORD_ARGON2ID);
		return $this;
	}

	/**
	 * Vérifier si un email correspond à cet utilisateur
	 */
	public function verifyEmail(string $email): bool
	{
		$normalizedEmail = strtolower(trim($email));
		return password_verify($normalizedEmail, $this->emailHash);
	}
	public function getDisplayName(): ?string
	{
		return $this->displayName;
	}

	public function setDisplayName(?string $displayName): static
	{
		$this->displayName = $displayName;
		return $this;
	}

	public function getCreatedAt(): ?\DateTimeImmutable
	{
		return $this->createdAt;
	}

	public function setCreatedAt(\DateTimeImmutable $createdAt): static
	{
		$this->createdAt = $createdAt;
		return $this;
	}

	public function getLastLoginAt(): ?\DateTimeImmutable
	{
		return $this->lastLoginAt;
	}

	public function setLastLoginAt(?\DateTimeImmutable $lastLoginAt): static
	{
		$this->lastLoginAt = $lastLoginAt;
		return $this;
	}

	/**
	 * @return Collection<int, Regatta>
	 */
	public function getRegattas(): Collection
	{
		return $this->regattas;
	}

	public function addRegatta(Regatta $regatta): static
	{
		if (!$this->regattas->contains($regatta)) {
			$this->regattas->add($regatta);
			$regatta->setOwner($this);
		}

		return $this;
	}

	public function removeRegatta(Regatta $regatta): static
	{
		if ($this->regattas->removeElement($regatta)) {
			if ($regatta->getOwner() === $this) {
				$regatta->setOwner(null);
			}
		}

		return $this;
	}

	/**
	 * @return Collection<int, Regatta>
	 */
	public function getSharedRegattas(): Collection
	{
		return $this->sharedRegattas;
	}

	public function addSharedRegatta(Regatta $regatta): static
	{
		if (!$this->sharedRegattas->contains($regatta)) {
			$this->sharedRegattas->add($regatta);
			$regatta->addCoOwner($this);
		}

		return $this;
	}

	public function removeSharedRegatta(Regatta $regatta): static
	{
		if ($this->sharedRegattas->removeElement($regatta)) {
			$regatta->removeCoOwner($this);
		}

		return $this;
	}

	// ===== Méthodes UserInterface pour Symfony Security =====

	public function getUserIdentifier(): string
	{
		return (string) $this->id;
	}



	public function getRoles(): array
	{
		$roles = $this->roles;
		// Garantir que chaque utilisateur a au moins ROLE_USER
		$roles[] = 'ROLE_USER';

		return array_unique($roles);
	}

	public function setRoles(array $roles): static
	{
		$this->roles = $roles;
		return $this;
	}

	public function eraseCredentials(): void
	{
		// Rien à effacer car on n'utilise pas de mot de passe en clair
	}

	/**
	 * Pour compatibilité : certaines parties (PropertyAccess, form etc.)
	 * peuvent tenter d'accéder à la propriété "password". Nous n'utilisons
	 * pas de mot de passe (authentification par magic link), donc on retourne null.
	 */
	public function getPassword(): ?string
	{
		return null;
	}
}
