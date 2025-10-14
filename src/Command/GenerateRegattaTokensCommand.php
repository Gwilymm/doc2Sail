<?php

namespace App\Command;

use App\Repository\RegattaRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(
	name: 'app:generate-regatta-tokens',
	description: 'Generate access tokens for regattas that don\'t have one',
)]
class GenerateRegattaTokensCommand extends Command
{
	public function __construct(
		private RegattaRepository $regattaRepository,
		private EntityManagerInterface $entityManager,
	) {
		parent::__construct();
	}

	protected function execute(InputInterface $input, OutputInterface $output): int
	{
		$io = new SymfonyStyle($input, $output);

		$regattas = $this->regattaRepository->findAll();
		$updated = 0;

		foreach ($regattas as $regatta) {
			if (!$regatta->getAccessToken()) {
				$regatta->setAccessToken(bin2hex(random_bytes(32)));
				$updated++;
				$io->writeln(sprintf('Generated token for: %s', $regatta->getName()));
			}
		}

		$this->entityManager->flush();

		$io->success(sprintf('Generated %d token(s)', $updated));

		return Command::SUCCESS;
	}
}
