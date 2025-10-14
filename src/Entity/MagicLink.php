<?php

namespace App\Entity;

use App\Repository\MagicLinkRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: MagicLinkRepository::class)]
class MagicLink
{
	#[ORM\Id]
	#[ORM\GeneratedValue]
	#[ORM\Column]
	private ?int $id = null;

	#[ORM\ManyToOne(targetEntity: User::class)]
	#[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
	private ?User $user = null;

	#[ORM\Column(length: 64, unique: true)]
	private ?string $token = null;

	#[ORM\Column]
	private ?\DateTimeImmutable $createdAt = null;

	#[ORM\Column]
	private ?\DateTimeImmutable $expiresAt = null;

	#[ORM\Column]
	private bool $used = false;

	public function __construct()
	{
		$this->token = bin2hex(random_bytes(32)); // 64 caractères
		$this->createdAt = new \DateTimeImmutable();
		$this->expiresAt = new \DateTimeImmutable('+15 minutes'); // Expire après 15 min
	}

	public function getId(): ?int
	{
		return $this->id;
	}

	public function getUser(): ?User
	{
		return $this->user;
	}

	public function setUser(?User $user): static
	{
		$this->user = $user;
		return $this;
	}

	public function getToken(): ?string
	{
		return $this->token;
	}

	public function getCreatedAt(): ?\DateTimeImmutable
	{
		return $this->createdAt;
	}

	public function getExpiresAt(): ?\DateTimeImmutable
	{
		return $this->expiresAt;
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

	public function isValid(): bool
	{
		return !$this->used && $this->expiresAt > new \DateTimeImmutable();
	}
}
