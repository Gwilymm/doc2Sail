<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20251125130227 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add email_hash to magic_link for security verification';
    }

    public function up(Schema $schema): void
    {
        // Supprimer les anciens magic links car on ne peut pas calculer leur emailHash
        $this->addSql('DELETE FROM magic_link');

        // Ajouter la colonne email_hash
        $this->addSql('ALTER TABLE magic_link ADD COLUMN email_hash VARCHAR(64) NOT NULL');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TEMPORARY TABLE __temp__magic_link AS SELECT id, user_id, token, short_code, created_at, expires_at, used, use_count, max_uses, ip_address, user_agent FROM magic_link');
        $this->addSql('DROP TABLE magic_link');
        $this->addSql('CREATE TABLE magic_link (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, user_id INTEGER NOT NULL, token VARCHAR(64) NOT NULL, short_code VARCHAR(6) NOT NULL, created_at DATETIME NOT NULL --(DC2Type:datetime_immutable)
        , expires_at DATETIME NOT NULL --(DC2Type:datetime_immutable)
        , used BOOLEAN NOT NULL, use_count INTEGER NOT NULL, max_uses INTEGER NOT NULL, ip_address VARCHAR(45) DEFAULT NULL, user_agent VARCHAR(255) DEFAULT NULL, CONSTRAINT FK_6B40B1C6A76ED395 FOREIGN KEY (user_id) REFERENCES "user" (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('INSERT INTO magic_link (id, user_id, token, short_code, created_at, expires_at, used, use_count, max_uses, ip_address, user_agent) SELECT id, user_id, token, short_code, created_at, expires_at, used, use_count, max_uses, ip_address, user_agent FROM __temp__magic_link');
        $this->addSql('DROP TABLE __temp__magic_link');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_6B40B1C65F37A13B ON magic_link (token)');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_6B40B1C617D2FE0D ON magic_link (short_code)');
        $this->addSql('CREATE INDEX IDX_6B40B1C6A76ED395 ON magic_link (user_id)');
        $this->addSql('CREATE INDEX idx_magic_link_token ON magic_link (token)');
        $this->addSql('CREATE INDEX idx_magic_link_short_code ON magic_link (short_code)');
        $this->addSql('CREATE INDEX idx_magic_link_expires_at ON magic_link (expires_at)');
    }
}
