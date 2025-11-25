<?php

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\Entity\Regatta;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\DependencyInjection\Attribute\Autowire;

class RegattaProcessor implements ProcessorInterface
{
	public function __construct(
		#[Autowire(service: 'api_platform.doctrine.orm.state.persist_processor')]
		private ProcessorInterface $persistProcessor,
		private Security $security
	) {}

	public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): mixed
	{
		if ($data instanceof Regatta && $operation instanceof \ApiPlatform\Metadata\Post) {
			// Assigner automatiquement le owner à l'utilisateur connecté lors de la création
			if (!$data->getOwner()) {
				$data->setOwner($this->security->getUser());
			}
		}

		return $this->persistProcessor->process($data, $operation, $uriVariables, $context);
	}
}
