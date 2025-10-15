<?php

namespace App\Entity;

use App\Repository\PushSubscriptionRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: PushSubscriptionRepository::class)]
#[ORM\Table(name: 'push_subscription')]
#[ORM\Index(columns: ['endpoint'], name: 'idx_endpoint')]
class PushSubscription
{
	#[ORM\Id]
	#[ORM\GeneratedValue]
	#[ORM\Column]
	private ?int $id = null;

	#[ORM\Column(type: 'text', unique: true)]
	private ?string $endpoint = null;

	#[ORM\Column(type: 'string', length: 255, nullable: true)]
	private ?string $publicKey = null;

	#[ORM\Column(type: 'string', length: 255, nullable: true)]
	private ?string $authToken = null;

	#[ORM\Column(type: 'string', length: 255, nullable: true)]
	private ?string $regattaToken = null;

	#[ORM\Column(type: 'datetime')]
	private ?\DateTimeInterface $createdAt = null;

	#[ORM\Column(type: 'datetime', nullable: true)]
	private ?\DateTimeInterface $lastUsedAt = null;

	public function __construct()
	{
		$this->createdAt = new \DateTime();
	}

	public function getId(): ?int
	{
		return $this->id;
	}

	public function getEndpoint(): ?string
	{
		return $this->endpoint;
	}

	public function setEndpoint(string $endpoint): static
	{
		$this->endpoint = $endpoint;
		return $this;
	}

	public function getPublicKey(): ?string
	{
		return $this->publicKey;
	}

	public function setPublicKey(?string $publicKey): static
	{
		$this->publicKey = $publicKey;
		return $this;
	}

	public function getAuthToken(): ?string
	{
		return $this->authToken;
	}

	public function setAuthToken(?string $authToken): static
	{
		$this->authToken = $authToken;
		return $this;
	}

	public function getRegattaToken(): ?string
	{
		return $this->regattaToken;
	}

	public function setRegattaToken(?string $regattaToken): static
	{
		$this->regattaToken = $regattaToken;
		return $this;
	}

	public function getCreatedAt(): ?\DateTimeInterface
	{
		return $this->createdAt;
	}

	public function setCreatedAt(\DateTimeInterface $createdAt): static
	{
		$this->createdAt = $createdAt;
		return $this;
	}

	public function getLastUsedAt(): ?\DateTimeInterface
	{
		return $this->lastUsedAt;
	}

	public function setLastUsedAt(?\DateTimeInterface $lastUsedAt): static
	{
		$this->lastUsedAt = $lastUsedAt;
		return $this;
	}

	/**
	 * Retourne les données de subscription au format attendu par web-push
	 */
	public function toArray(): array
	{
		return [
			'endpoint' => $this->endpoint,
			'keys' => [
				'p256dh' => $this->publicKey,
				'auth' => $this->authToken,
			],
		];
	}
}
