<?php

namespace App\Entity;

use App\Repository\RegattaInvitationRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: RegattaInvitationRepository::class)]
class RegattaInvitation
{
	#[ORM\Id]
	#[ORM\GeneratedValue]
	#[ORM\Column]
	private ?int $id = null;

	#[ORM\ManyToOne(targetEntity: Regatta::class)]
	#[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
	private ?Regatta $regatta = null;

	#[ORM\Column(length: 255)]
	private ?string $invitedEmail = null;

	#[ORM\Column(length: 64, unique: true)]
	private ?string $token = null;

	#[ORM\Column]
	private ?\DateTimeImmutable $createdAt = null;

	#[ORM\Column]
	private ?\DateTimeImmutable $expiresAt = null;

	#[ORM\Column]
	private bool $used = false;

	#[ORM\ManyToOne(targetEntity: User::class)]
	#[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
	private ?User $invitedBy = null;

	public function __construct()
	{
		$this->token = bin2hex(random_bytes(32));
		$this->createdAt = new \DateTimeImmutable();
		$this->expiresAt = new \DateTimeImmutable('+7 days'); // Expire dans 7 jours
	}

	public function getId(): ?int
	{
		return $this->id;
	}

	public function getRegatta(): ?Regatta
	{
		return $this->regatta;
	}

	public function setRegatta(?Regatta $regatta): static
	{
		$this->regatta = $regatta;

		return $this;
	}

	public function getInvitedEmail(): ?string
	{
		return $this->invitedEmail;
	}

	public function setInvitedEmail(string $invitedEmail): static
	{
		$this->invitedEmail = strtolower(trim($invitedEmail));

		return $this;
	}

	public function getToken(): ?string
	{
		return $this->token;
	}

	public function setToken(string $token): static
	{
		$this->token = $token;

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

	public function getExpiresAt(): ?\DateTimeImmutable
	{
		return $this->expiresAt;
	}

	public function setExpiresAt(\DateTimeImmutable $expiresAt): static
	{
		$this->expiresAt = $expiresAt;

		return $this;
	}

	public function isUsed(): bool
	{
		return $this->used;
	}

	public function setUsed(bool $used): static
	{
		$this->used = $used;

		return $this;
	}

	public function getInvitedBy(): ?User
	{
		return $this->invitedBy;
	}

	public function setInvitedBy(?User $invitedBy): static
	{
		$this->invitedBy = $invitedBy;

		return $this;
	}

	public function isValid(): bool
	{
		return !$this->used && $this->expiresAt > new \DateTimeImmutable();
	}
}
