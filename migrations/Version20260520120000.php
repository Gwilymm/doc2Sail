<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260520120000 extends AbstractMigration
{
	public function getDescription(): string
	{
		return 'Add read-only regatta shares saved from public QR links';
	}

	public function up(Schema $schema): void
	{
		$this->addSql('CREATE TABLE regatta_share (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, user_id INTEGER NOT NULL, regatta_id INTEGER NOT NULL, created_at DATETIME NOT NULL --(DC2Type:datetime_immutable)
, CONSTRAINT FK_284D7E4BA76ED395 FOREIGN KEY (user_id) REFERENCES "user" (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE, CONSTRAINT FK_284D7E4B1B2E8B9A FOREIGN KEY (regatta_id) REFERENCES regatta (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE)');
		$this->addSql('CREATE INDEX IDX_5E8FE227A76ED395 ON regatta_share (user_id)');
		$this->addSql('CREATE INDEX IDX_5E8FE22776569257 ON regatta_share (regatta_id)');
		$this->addSql('CREATE UNIQUE INDEX UNIQ_REGATTA_SHARE_USER_REGATTA ON regatta_share (user_id, regatta_id)');
	}

	public function down(Schema $schema): void
	{
		$this->addSql('DROP TABLE regatta_share');
	}
}
