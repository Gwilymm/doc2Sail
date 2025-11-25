<?php

namespace App\Entity;

use App\Repository\MagicLinkRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: MagicLinkRepository::class)]
#[ORM\Table(name: 'magic_link')]
#[ORM\Index(columns: ['token'], name: 'idx_magic_link_token')]
#[ORM\Index(columns: ['short_code'], name: 'idx_magic_link_short_code')]
#[ORM\Index(columns: ['expires_at'], name: 'idx_magic_link_expires_at')]
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

	#[ORM\Column(length: 6, unique: true)]
	private ?string $shortCode = null;

	#[ORM\Column(length: 64)]
	private ?string $emailHash = null;

	#[ORM\Column]
	private ?\DateTimeImmutable $createdAt = null;

	#[ORM\Column]
	private ?\DateTimeImmutable $expiresAt = null;

	#[ORM\Column]
	private bool $used = false;

	#[ORM\Column]
	private int $useCount = 0;

	#[ORM\Column]
	private int $maxUses = 1;

	#[ORM\Column(length: 45, nullable: true)]
	private ?string $ipAddress = null;

	#[ORM\Column(length: 255, nullable: true)]
	private ?string $userAgent = null;

	public function __construct()
	{
		$this->token = bin2hex(random_bytes(32)); // 64 caractères
		$this->shortCode = $this->generateShortCode();
		$this->createdAt = new \DateTimeImmutable();
		$this->expiresAt = new \DateTimeImmutable('+15 minutes'); // Expire après 15 min
	}

	private function generateShortCode(): string
	{
		// Génère un code de 6 caractères alphanumériques (majuscules uniquement)
		// Exclut les caractères ambigus : 0, O, I, 1
		$chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
		$code = '';
		for ($i = 0; $i < 6; $i++) {
			$code .= $chars[random_int(0, strlen($chars) - 1)];
		}
		return $code;
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

	public function setToken(string $token): static
	{
		$this->token = $token;
		return $this;
	}

	public function getShortCode(): ?string
	{
		return $this->shortCode;
	}

	public function setShortCode(string $shortCode): static
	{
		$this->shortCode = $shortCode;
		return $this;
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

	public function getUseCount(): int
	{
		return $this->useCount;
	}

	public function incrementUseCount(): static
	{
		$this->useCount++;
		if ($this->useCount >= $this->maxUses) {
			$this->used = true;
		}
		return $this;
	}

	public function getMaxUses(): int
	{
		return $this->maxUses;
	}

	public function setMaxUses(int $maxUses): static
	{
		$this->maxUses = $maxUses;
		return $this;
	}

	public function getIpAddress(): ?string
	{
		return $this->ipAddress;
	}

	public function setIpAddress(?string $ipAddress): static
	{
		$this->ipAddress = $ipAddress;
		return $this;
	}

	public function getUserAgent(): ?string
	{
		return $this->userAgent;
	}

	public function setUserAgent(?string $userAgent): static
	{
		$this->userAgent = $userAgent;
		return $this;
	}

	public function isValid(): bool
	{
		return !$this->used
			&& $this->expiresAt > new \DateTimeImmutable()
			&& $this->useCount < $this->maxUses;
	}

	public function getRemainingSeconds(): int
	{
		$now = new \DateTimeImmutable();
		if ($this->expiresAt <= $now) {
			return 0;
		}
		return $this->expiresAt->getTimestamp() - $now->getTimestamp();
	}
}
