<?php

namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity]
#[ORM\Table(name: 'contact_message')]
class ContactMessage
{
	#[ORM\Id]
	#[ORM\GeneratedValue]
	#[ORM\Column]
	private ?int $id = null;

	#[ORM\Column(length: 255, nullable: true)]
	private ?string $name = null;

	#[ORM\Column(length: 255)]
	private string $email;

	#[ORM\Column(length: 255, nullable: true)]
	private ?string $subject = null;

	#[ORM\Column(type: 'text')]
	private string $message;

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

	public function getName(): ?string
	{
		return $this->name;
	}

	public function setName(?string $name): self
	{
		$this->name = $name;
		return $this;
	}

	public function getEmail(): ?string
	{
		return $this->email ?? null;
	}

	public function setEmail(string $email): self
	{
		$this->email = $email;
		return $this;
	}

	public function getSubject(): ?string
	{
		return $this->subject;
	}

	public function setSubject(?string $subject): self
	{
		$this->subject = $subject;
		return $this;
	}

	public function getMessage(): ?string
	{
		return $this->message ?? null;
	}

	public function setMessage(string $message): self
	{
		$this->message = $message;
		return $this;
	}

	public function getCreatedAt(): ?\DateTimeImmutable
	{
		return $this->createdAt;
	}

	public function setCreatedAt(\DateTimeImmutable $createdAt): self
	{
		$this->createdAt = $createdAt;
		return $this;
	}
}
