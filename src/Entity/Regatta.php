<?php

namespace App\Entity;

use App\Repository\RegattaRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\Validator\Constraints\UniqueEntity;
use Symfony\Component\Validator\Constraints as Assert;
use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Post;
use ApiPlatform\Metadata\Put;
use ApiPlatform\Metadata\Delete;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: RegattaRepository::class)]
#[ApiResource(
    normalizationContext: ['groups' => ['regatta:read']],
    denormalizationContext: ['groups' => ['regatta:write']],
    paginationItemsPerPage: 20,
    operations: [
        new Get(normalizationContext: ['groups' => ['regatta:read', 'regatta:read:details']]),
        new GetCollection(
            paginationEnabled: true,
            paginationItemsPerPage: 20,
            paginationMaximumItemsPerPage: 100
        ),
        new Post(
            security: "is_granted('ROLE_USER')",
            processor: \App\State\RegattaProcessor::class
        ),
        new Put(
            security: "is_granted('REGATTA_EDIT', object)",
            securityMessage: "Seul le propriétaire ou un co-propriétaire peut modifier cette régate."
        ),
        new Delete(
            security: "is_granted('REGATTA_DELETE', object)",
            securityMessage: "Seul le propriétaire peut supprimer cette régate."
        ),
    ]
)]
#[UniqueEntity(
    fields: ['name'],
    message: 'Une régate avec ce nom existe déjà.'
)]
class Regatta
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['regatta:read'])]
    private ?int $id = null;

    #[ORM\Column(length: 255, unique: true)]
    #[Assert\NotBlank(message: 'Le nom de la régate est obligatoire')]
    #[Assert\Length(max: 255)]
    #[Groups(['regatta:read', 'regatta:write'])]
    private ?string $name = null;

    #[ORM\Column(type: Types::DATE_MUTABLE)]
    #[Assert\NotBlank(message: 'La date de début est obligatoire')]
    #[Groups(['regatta:read', 'regatta:write'])]
    private ?\DateTimeInterface $startDate = null;

    #[ORM\Column(type: Types::DATE_MUTABLE)]
    #[Assert\NotBlank(message: 'La date de fin est obligatoire')]
    #[Groups(['regatta:read', 'regatta:write'])]
    private ?\DateTimeInterface $endDate = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Groups(['regatta:read', 'regatta:write'])]
    private ?string $description = null;

    /**
     * @var Collection<int, Document>
     */
    #[ORM\OneToMany(targetEntity: Document::class, mappedBy: 'regatta', cascade: ['persist', 'remove'], orphanRemoval: true)]
    #[Groups(['regatta:read:details'])]
    private Collection $documents;

    #[ORM\Column(type: Types::DATETIME_MUTABLE)]
    #[Groups(['regatta:read'])]
    private ?\DateTimeInterface $createdAt = null;

    #[ORM\Column(length: 64, unique: true, nullable: true)]
    #[Groups(['regatta:read'])]
    private ?string $accessToken = null;

    #[ORM\ManyToOne(targetEntity: User::class, inversedBy: 'regattas')]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    #[Groups(['regatta:read', 'regatta:write'])]
    private ?User $owner = null;

    /**
     * @var Collection<int, User>
     */
    #[ORM\ManyToMany(targetEntity: User::class, inversedBy: 'sharedRegattas')]
    #[ORM\JoinTable(name: 'regatta_co_owners')]
    #[Groups(['regatta:read'])]
    private Collection $coOwners;

    public function __construct()
    {
        $this->documents = new ArrayCollection();
        $this->coOwners = new ArrayCollection();
        $this->createdAt = new \DateTime();
        $this->accessToken = bin2hex(random_bytes(32));
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

    public function getStartDate(): ?\DateTimeInterface
    {
        return $this->startDate;
    }

    public function setStartDate(\DateTimeInterface $startDate): static
    {
        $this->startDate = $startDate;

        return $this;
    }

    public function getEndDate(): ?\DateTimeInterface
    {
        return $this->endDate;
    }

    public function setEndDate(\DateTimeInterface $endDate): static
    {
        $this->endDate = $endDate;

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

    /**
     * @return Collection<int, Document>
     */
    public function getDocuments(): Collection
    {
        return $this->documents;
    }

    public function addDocument(Document $document): static
    {
        if (!$this->documents->contains($document)) {
            $this->documents->add($document);
            $document->setRegatta($this);
        }

        return $this;
    }

    public function removeDocument(Document $document): static
    {
        if ($this->documents->removeElement($document)) {
            // set the owning side to null (unless already changed)
            if ($document->getRegatta() === $this) {
                $document->setRegatta(null);
            }
        }

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

    public function getAccessToken(): ?string
    {
        return $this->accessToken;
    }

    public function setAccessToken(string $accessToken): static
    {
        $this->accessToken = $accessToken;

        return $this;
    }

    public function getOwner(): ?User
    {
        return $this->owner;
    }

    public function setOwner(?User $owner): static
    {
        $this->owner = $owner;

        return $this;
    }

    /**
     * @return Collection<int, User>
     */
    public function getCoOwners(): Collection
    {
        return $this->coOwners;
    }

    public function addCoOwner(User $coOwner): static
    {
        if (!$this->coOwners->contains($coOwner)) {
            $this->coOwners->add($coOwner);
        }

        return $this;
    }

    public function removeCoOwner(User $coOwner): static
    {
        $this->coOwners->removeElement($coOwner);

        return $this;
    }

    public function isCoOwner(User $user): bool
    {
        return $this->coOwners->contains($user);
    }

    public function canManage(User $user): bool
    {
        return $this->owner === $user || $this->isCoOwner($user);
    }

    public function __toString(): string
    {
        return $this->name ?? 'Nouvelle régate';
    }
}
