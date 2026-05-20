<?php

namespace App\Entity;

use App\Repository\RegattaShareRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: RegattaShareRepository::class)]
#[ORM\UniqueConstraint(name: 'UNIQ_REGATTA_SHARE_USER_REGATTA', columns: ['user_id', 'regatta_id'])]
class RegattaShare
{
	#[ORM\Id]
	#[ORM\GeneratedValue]
	#[ORM\Column]
	private ?int $id = null;

	#[ORM\ManyToOne(targetEntity: User::class)]
	#[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
	private ?User $user = null;

	#[ORM\ManyToOne(targetEntity: Regatta::class)]
	#[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
	private ?Regatta $regatta = null;

	#[ORM\Column]
	private ?\DateTimeImmutable $createdAt = null;

	public function __construct()
	{
		$this->createdAt = new \DateTimeImmutable();
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

	public function getRegatta(): ?Regatta
	{
		return $this->regatta;
	}

	public function setRegatta(?Regatta $regatta): static
	{
		$this->regatta = $regatta;

		return $this;
	}

	public function getCreatedAt(): ?\DateTimeImmutable
	{
		return $this->createdAt;
	}
}
