<?php

namespace App\Dto;

class UserMeDto
{
	public ?int $id = null;
	public ?string $displayName = null;
	public array $roles = [];
	public ?\DateTimeImmutable $createdAt = null;
	public ?\DateTimeImmutable $lastLoginAt = null;
	public int $regattasCount = 0;
	public int $sharedRegattasCount = 0;
}
