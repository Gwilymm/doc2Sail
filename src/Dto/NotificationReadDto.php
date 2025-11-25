<?php

namespace App\Dto;

use Symfony\Component\Validator\Constraints as Assert;

class NotificationReadDto
{
	#[Assert\NotBlank(message: 'L\'ID de la notification est requis')]
	#[Assert\Type(type: 'integer', message: 'L\'ID doit être un entier')]
	public ?int $notificationId = null;
}
