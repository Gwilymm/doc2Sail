<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20251014193800 extends AbstractMigration
{
	public function getDescription(): string
	{
		return 'Ajout tables User et MagicLink + relation regatta-user';
	}

	public function up(Schema $schema): void
	{
		// Créer la table user
		$this->addSql('CREATE TABLE user (
            id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
            email_hash VARCHAR(255) NOT NULL UNIQUE,
            display_name VARCHAR(100) DEFAULT NULL,
            created_at DATETIME NOT NULL,
            last_login_at DATETIME DEFAULT NULL
        )');

		// Créer la table magic_link
		$this->addSql('CREATE TABLE magic_link (
            id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
            user_id INTEGER NOT NULL,
            token VARCHAR(64) NOT NULL UNIQUE,
            created_at DATETIME NOT NULL,
            expires_at DATETIME NOT NULL,
            used BOOLEAN NOT NULL DEFAULT 0,
            FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
        )');

		// Créer un index sur le token pour accélérer les recherches
		$this->addSql('CREATE INDEX IDX_magic_link_token ON magic_link (token)');
		$this->addSql('CREATE INDEX IDX_magic_link_user ON magic_link (user_id)');

		// Ajouter la colonne owner_id à regatta
		$this->addSql('ALTER TABLE regatta ADD COLUMN owner_id INTEGER DEFAULT NULL');
		$this->addSql('CREATE INDEX IDX_regatta_owner ON regatta (owner_id)');
	}

	public function down(Schema $schema): void
	{
		$this->addSql('DROP TABLE magic_link');
		$this->addSql('DROP TABLE user');

		// Supprimer la colonne owner_id de regatta (SQLite ne supporte pas DROP COLUMN directement)
		// Il faudrait recréer la table complètement pour le downgrade
	}
}
