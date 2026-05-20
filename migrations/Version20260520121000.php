<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260520121000 extends AbstractMigration
{
	public function getDescription(): string
	{
		return 'Align regatta share index names with Doctrine metadata';
	}

	public function up(Schema $schema): void
	{
		$this->addSql('DROP INDEX IF EXISTS IDX_284D7E4BA76ED395');
		$this->addSql('DROP INDEX IF EXISTS IDX_284D7E4B1B2E8B9A');
		$this->addSql('CREATE INDEX IF NOT EXISTS IDX_5E8FE227A76ED395 ON regatta_share (user_id)');
		$this->addSql('CREATE INDEX IF NOT EXISTS IDX_5E8FE22776569257 ON regatta_share (regatta_id)');
	}

	public function down(Schema $schema): void
	{
		$this->addSql('DROP INDEX IF EXISTS IDX_5E8FE227A76ED395');
		$this->addSql('DROP INDEX IF EXISTS IDX_5E8FE22776569257');
		$this->addSql('CREATE INDEX IF NOT EXISTS IDX_284D7E4BA76ED395 ON regatta_share (user_id)');
		$this->addSql('CREATE INDEX IF NOT EXISTS IDX_284D7E4B1B2E8B9A ON regatta_share (regatta_id)');
	}
}
