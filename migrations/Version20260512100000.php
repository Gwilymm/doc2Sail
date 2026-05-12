<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260512100000 extends AbstractMigration
{
	public function getDescription(): string
	{
		return 'Add deterministic HMAC email lookup hash for users';
	}

	public function up(Schema $schema): void
	{
		$this->addSql('ALTER TABLE "user" ADD COLUMN email_lookup_hash VARCHAR(64) DEFAULT NULL');
		$this->addSql('CREATE UNIQUE INDEX UNIQ_8D93D64997EAF943 ON "user" (email_lookup_hash)');
	}

	public function down(Schema $schema): void
	{
		$this->addSql('DROP INDEX UNIQ_8D93D64997EAF943');
		$this->addSql('CREATE TEMPORARY TABLE __temp__user AS SELECT id, email_hash, roles, display_name, created_at, last_login_at FROM "user"');
		$this->addSql('DROP TABLE "user"');
		$this->addSql('CREATE TABLE "user" (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, email_hash VARCHAR(255) NOT NULL, roles CLOB NOT NULL --(DC2Type:json)
, display_name VARCHAR(100) DEFAULT NULL, created_at DATETIME NOT NULL --(DC2Type:datetime_immutable)
, last_login_at DATETIME DEFAULT NULL --(DC2Type:datetime_immutable)
)');
		$this->addSql('INSERT INTO "user" (id, email_hash, roles, display_name, created_at, last_login_at) SELECT id, email_hash, roles, display_name, created_at, last_login_at FROM __temp__user');
		$this->addSql('DROP TABLE __temp__user');
		$this->addSql('CREATE UNIQUE INDEX UNIQ_8D93D6494E8E423D ON "user" (email_hash)');
	}
}
