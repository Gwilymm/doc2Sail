<?php

namespace App\Entity;

use App\Repository\DocumentRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints as Assert;
use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Post;
use ApiPlatform\Metadata\Delete;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: DocumentRepository::class)]
#[ORM\HasLifecycleCallbacks]
#[ApiResource(
	normalizationContext: ['groups' => ['document:read']],
	denormalizationContext: ['groups' => ['document:write']],
	paginationItemsPerPage: 30,
	operations: [
		new Get(normalizationContext: ['groups' => ['document:read', 'document:read:details']]),
		new GetCollection(
			uriTemplate: '/regattas/{regattaId}/documents',
			uriVariables: ['regattaId'],
			paginationEnabled: true,
			paginationItemsPerPage: 30,
			paginationMaximumItemsPerPage: 100,
			provider: \App\State\RegattaDocumentsProvider::class
		),
		new Post(
			security: "is_granted('ROLE_USER')"
		),
		new Delete(
			security: "is_granted('ROLE_USER')"
		),
	]
)]
class Document
{
	public const DEFAULT_CATEGORY = 'Autre';

	public const AVAILABLE_CATEGORIES = [
		'AC',
		'IC',
		'Modifications',
		'Gestion de course',
		'Jury',
		'Résultats',
	];
	#[ORM\Id]
	#[ORM\GeneratedValue]
	#[ORM\Column]
	#[Groups(['document:read', 'regatta:read:details'])]
	private ?int $id = null;

	#[ORM\Column(length: 255)]
	#[Assert\NotBlank(message: 'Le nom du document est obligatoire')]
	#[Groups(['document:read', 'document:write', 'regatta:read:details'])]
	private ?string $name = null;

	#[ORM\Column(type: Types::TEXT, nullable: true)]
	#[Groups(['document:read', 'document:write', 'regatta:read:details'])]
	private ?string $description = null;

	#[ORM\Column(length: 255)]
	#[Groups(['document:read'])]
	private ?string $filename = null;

	#[ORM\Column(length: 255)]
	#[Groups(['document:read', 'regatta:read:details'])]
	private ?string $mimeType = null;

	#[ORM\Column]
	#[Groups(['document:read', 'regatta:read:details'])]
	private ?int $size = null;

	#[ORM\Column(type: Types::DATETIME_MUTABLE)]
	#[Groups(['document:read', 'regatta:read:details'])]
	private ?\DateTimeInterface $uploadedAt = null;

	#[ORM\ManyToOne(targetEntity: Regatta::class, inversedBy: 'documents')]
	#[ORM\JoinColumn(nullable: true, onDelete: 'SET NULL')]
	#[Groups(['document:read:details', 'document:write'])]
	private ?Regatta $regatta = null;

	#[ORM\Column(length: 100)]
	#[Assert\NotBlank(message: 'La catégorie du document est obligatoire')]
	#[Assert\Length(max: 100, maxMessage: 'La catégorie ne peut pas dépasser 100 caractères')]
	#[Groups(['document:read', 'document:write', 'regatta:read:details'])]
	private ?string $category = self::DEFAULT_CATEGORY;

	// Propriété temporaire pour l'upload (non persistée en BDD)
	#[Assert\File(
		maxSize: '100M',
		mimeTypes: [
			'application/pdf',
			'application/msword',
			'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
			'application/vnd.ms-excel',
			'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
			'image/jpeg',
			'image/png',
			'image/gif',
			'text/plain',
		],
		mimeTypesMessage: 'Format de fichier non autorisé'
	)]
	private $file = null;

	#[ORM\PrePersist]
	public function setUploadedAtValue(): void
	{
		$this->uploadedAt = new \DateTime();
	}

	public function getId(): ?int
	{
		return $this->id;
	}

	public function getName(): ?string
	{
		return $this->name;
	}

	public function setName(string $name): static
	{
		$this->name = $name;

		return $this;
	}

	public function getDescription(): ?string
	{
		return $this->description;
	}

	public function setDescription(?string $description): static
	{
		$this->description = $description;

		return $this;
	}

	public function getFilename(): ?string
	{
		return $this->filename;
	}

	public function setFilename(string $filename): static
	{
		$this->filename = $filename;

		return $this;
	}

	public function getMimeType(): ?string
	{
		return $this->mimeType;
	}

	public function setMimeType(string $mimeType): static
	{
		$this->mimeType = $mimeType;

		return $this;
	}

	public function getSize(): ?int
	{
		return $this->size;
	}

	public function setSize(int $size): static
	{
		$this->size = $size;

		return $this;
	}

	public function getUploadedAt(): ?\DateTimeInterface
	{
		return $this->uploadedAt;
	}

	public function setUploadedAt(\DateTimeInterface $uploadedAt): static
	{
		$this->uploadedAt = $uploadedAt;

		return $this;
	}

	public function getFile()
	{
		return $this->file;
	}

	public function setFile($file): static
	{
		$this->file = $file;

		return $this;
	}

	public function getFilePath(): string
	{
		if ($this->regatta) {
			return 'uploads/documents/' . $this->regatta->getId() . '/' . $this->filename;
		}
		return 'uploads/documents/' . $this->filename;
	}

	public function getFormattedSize(): string
	{
		$units = ['B', 'K', 'M', 'G'];
		$size = $this->size;
		$unit = 0;

		while ($size >= 1024 && $unit < count($units) - 1) {
			$size /= 1024;
			$unit++;
		}

		return round($size, 2) . ' ' . $units[$unit];
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

	public function getCategory(): string
	{
		return $this->category ?? self::DEFAULT_CATEGORY;
	}

	public function setCategory(?string $category): static
	{
		$normalized = $category ? trim($category) : null;
		$this->category = $normalized !== '' ? $normalized : self::DEFAULT_CATEGORY;

		return $this;
	}
}
