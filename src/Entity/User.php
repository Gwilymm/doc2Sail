<?php

namespace App\Entity;

use App\Repository\UserRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: UserRepository::class)]
#[ORM\Table(name: '`user`')]
class User
{
	#[ORM\Id]
	#[ORM\GeneratedValue]
	#[ORM\Column]
	private ?int $id = null;

	#[ORM\Column(length: 255, unique: true)]
	private ?string $emailHash = null; // Email hashé (Argon2id)	#[ORM\Column(length: 100, nullable: true)]
	private ?string $displayName = null; // Nom d'affichage optionnel (ex: "Skipper Alpha")

	#[ORM\Column]
	private ?\DateTimeImmutable $createdAt = null;

	#[ORM\Column(nullable: true)]
	private ?\DateTimeImmutable $lastLoginAt = null;

	/**
	 * @var Collection<int, Regatta>
	 */
	#[ORM\OneToMany(targetEntity: Regatta::class, mappedBy: 'owner', cascade: ['persist', 'remove'])]
	private Collection $regattas;

	public function __construct()
	{
		$this->regattas = new ArrayCollection();
		$this->createdAt = new \DateTimeImmutable();
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
}
