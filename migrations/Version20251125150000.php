<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Migration pour hasher les short_code en base de données
 * Sécurité : Protège les codes actifs en cas de compromission DB
 */
final class Version20251125150000 extends AbstractMigration
{
	public function getDescription(): string
	{
		return 'Hash short_code pour sécurité renforcée - Priority 3';
	}

	public function up(Schema $schema): void
	{
		// SQLite : Recréer la table avec la nouvelle structure

		// 1. Créer nouvelle table avec short_code_hash
		$this->addSql('CREATE TABLE magic_link_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
            user_id INTEGER NOT NULL,
            token VARCHAR(64) NOT NULL,
            short_code_hash VARCHAR(64) NOT NULL,
            email_hash VARCHAR(64) NOT NULL,
            created_at DATETIME NOT NULL,
            expires_at DATETIME NOT NULL,
            used BOOLEAN NOT NULL,
            use_count INTEGER NOT NULL,
            max_uses INTEGER NOT NULL,
            ip_address VARCHAR(45) DEFAULT NULL,
            user_agent VARCHAR(255) DEFAULT NULL,
            CONSTRAINT FK_magic_link_user FOREIGN KEY (user_id) REFERENCES user (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE
        )');
	}

	public function postUp(Schema $schema): void
	{
		// 2. Migrer les données APRÈS création de la table
		$connection = $this->connection;
		$magicLinks = $connection->fetchAllAssociative('SELECT * FROM magic_link');

		foreach ($magicLinks as $link) {
			$shortCodeHash = hash('sha256', $link['short_code']);
			$connection->insert('magic_link_new', [
				'id' => $link['id'],
				'user_id' => $link['user_id'],
				'token' => $link['token'],
				'short_code_hash' => $shortCodeHash,
				'email_hash' => $link['email_hash'],
				'created_at' => $link['created_at'],
				'expires_at' => $link['expires_at'],
				'used' => $link['used'],
				'use_count' => $link['use_count'],
				'max_uses' => $link['max_uses'],
				'ip_address' => $link['ip_address'] ?? null,
				'user_agent' => $link['user_agent'] ?? null,
			]);
		}

		// 3. Supprimer ancienne table et renommer
		$connection->executeStatement('DROP TABLE magic_link');
		$connection->executeStatement('ALTER TABLE magic_link_new RENAME TO magic_link');

		// 4. Créer les index
		$connection->executeStatement('CREATE UNIQUE INDEX UNIQ_5B94FEE35F37A13B ON magic_link (token)');
		$connection->executeStatement('CREATE INDEX idx_magic_link_short_code_hash ON magic_link (short_code_hash)');
		$connection->executeStatement('CREATE INDEX idx_magic_link_expires_at ON magic_link (expires_at)');
		$connection->executeStatement('CREATE INDEX IDX_magic_link_user ON magic_link (user_id)');
	}

	public function down(Schema $schema): void
	{
		// Restore avec short_code - impossible de retrouver les codes originaux
		// Les magic links expireront de toute façon en 15min

		$this->addSql('CREATE TABLE magic_link_old (
            id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
            user_id INTEGER NOT NULL,
            token VARCHAR(64) NOT NULL,
            short_code VARCHAR(6) DEFAULT NULL,
            email_hash VARCHAR(64) NOT NULL,
            created_at DATETIME NOT NULL,
            expires_at DATETIME NOT NULL,
            used BOOLEAN NOT NULL,
            use_count INTEGER NOT NULL,
            max_uses INTEGER NOT NULL,
            ip_address VARCHAR(45) DEFAULT NULL,
            user_agent VARCHAR(255) DEFAULT NULL,
            CONSTRAINT FK_magic_link_user FOREIGN KEY (user_id) REFERENCES user (id) ON DELETE CASCADE
        )');

		$this->addSql('DROP TABLE magic_link');
		$this->addSql('ALTER TABLE magic_link_old RENAME TO magic_link');

		$this->addSql('CREATE UNIQUE INDEX UNIQ_5B94FEE35F37A13B ON magic_link (token)');
		$this->addSql('CREATE INDEX idx_magic_link_expires_at ON magic_link (expires_at)');
		$this->addSql('CREATE INDEX IDX_magic_link_user ON magic_link (user_id)');
	}
}
