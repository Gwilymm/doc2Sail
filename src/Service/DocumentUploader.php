<?php

namespace App\Service;

use Symfony\Component\HttpFoundation\File\Exception\FileException;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\String\Slugger\SluggerInterface;

class DocumentUploader
{
	public function __construct(
		private string $targetDirectory,
		private SluggerInterface $slugger,
	) {}

	public function upload(UploadedFile $file, ?int $regattaId = null): array
	{
		// Récupérer les informations AVANT de déplacer le fichier
		$mimeType = $file->getMimeType();
		$size = $file->getSize();

		$originalFilename = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
		$safeFilename = $this->slugger->slug($originalFilename);
		$fileName = $safeFilename . '-' . uniqid() . '.' . $file->guessExtension();

		// Déterminer le répertoire cible
		$targetDir = $this->getTargetDirectory($regattaId);

		// Créer le répertoire s'il n'existe pas
		if (!is_dir($targetDir)) {
			mkdir($targetDir, 0777, true);
		}

		try {
			$file->move($targetDir, $fileName);
		} catch (FileException $e) {
			throw new \Exception('Erreur lors de l\'upload du fichier: ' . $e->getMessage());
		}

		return [
			'filename' => $fileName,
			'mimeType' => $mimeType,
			'size' => $size,
		];
	}

	public function delete(string $filename, ?int $regattaId = null): void
	{
		if ($filename === '') {
			return;
		}

		$filePath = $this->getPath($filename, $regattaId);

		if (is_file($filePath)) {
			unlink($filePath);
		}
	}

	public function exists(?string $filename, ?int $regattaId = null): bool
	{
		if ($filename === null || $filename === '') {
			return false;
		}

		return is_file($this->getPath($filename, $regattaId));
	}

	public function getPath(string $filename, ?int $regattaId = null): string
	{
		return $this->getTargetDirectory($regattaId) . '/' . $filename;
	}

	public function deleteRegattaDirectory(int $regattaId): void
	{
		$regattaDir = $this->targetDirectory . '/' . $regattaId;

		if (is_dir($regattaDir)) {
			// Supprimer tous les fichiers du répertoire
			$files = glob($regattaDir . '/*');
			foreach ($files as $file) {
				if (is_file($file)) {
					unlink($file);
				}
			}
			// Supprimer le répertoire
			rmdir($regattaDir);
		}
	}

	public function getTargetDirectory(?int $regattaId = null): string
	{
		if ($regattaId !== null) {
			return $this->targetDirectory . '/' . $regattaId;
		}
		return $this->targetDirectory;
	}
}
