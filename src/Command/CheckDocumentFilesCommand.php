<?php

namespace App\Command;

use App\Entity\Document;
use App\Repository\DocumentRepository;
use App\Service\DocumentUploader;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(
	name: 'app:documents:check-files',
	description: 'Vérifie que les fichiers physiques des documents existent encore.',
)]
class CheckDocumentFilesCommand extends Command
{
	public function __construct(
		private DocumentRepository $documentRepository,
		private DocumentUploader $documentUploader,
		private EntityManagerInterface $entityManager,
	) {
		parent::__construct();
	}

	protected function configure(): void
	{
		$this->addOption(
			'delete-missing',
			null,
			InputOption::VALUE_NONE,
			'Supprime de la base les documents dont le fichier physique est absent.'
		);
	}

	protected function execute(InputInterface $input, OutputInterface $output): int
	{
		$io = new SymfonyStyle($input, $output);
		$deleteMissing = (bool) $input->getOption('delete-missing');
		$documents = $this->documentRepository->findAll();
		$missingRows = [];

		foreach ($documents as $document) {
			/** @var Document $document */
			$filename = $document->getFilename();
			$regatta = $document->getRegatta();
			$regattaId = $regatta?->getId();

			if ($this->documentUploader->exists($filename, $regattaId)) {
				continue;
			}

			$missingRows[] = [
				$document->getId(),
				$regattaId ?? '-',
				$document->getName(),
				$filename ?? '-',
				$filename ? $this->documentUploader->getPath($filename, $regattaId) : '-',
			];

			if ($deleteMissing) {
				$this->entityManager->remove($document);
			}
		}

		if ($missingRows === []) {
			$io->success(sprintf('Tous les fichiers existent (%d document(s) vérifié(s)).', count($documents)));

			return Command::SUCCESS;
		}

		$io->warning(sprintf(
			'%d document(s) pointent vers un fichier absent.',
			count($missingRows)
		));
		$io->table(['ID', 'Régate', 'Nom', 'Fichier', 'Chemin attendu'], $missingRows);

		if ($deleteMissing) {
			$this->entityManager->flush();
			$io->success(sprintf('%d document(s) supprimé(s) de la base.', count($missingRows)));
		} else {
			$io->note('Relancez avec --delete-missing pour supprimer uniquement les lignes en base qui pointent vers un fichier absent.');
		}

		return Command::SUCCESS;
	}
}
