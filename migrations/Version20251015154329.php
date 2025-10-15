<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20251015154329 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE push_subscription (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, endpoint CLOB NOT NULL, public_key VARCHAR(255) DEFAULT NULL, auth_token VARCHAR(255) DEFAULT NULL, regatta_token VARCHAR(255) DEFAULT NULL, created_at DATETIME NOT NULL, last_used_at DATETIME DEFAULT NULL)');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_562830F3C4420F7B ON push_subscription (endpoint)');
        $this->addSql('CREATE INDEX idx_endpoint ON push_subscription (endpoint)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('DROP TABLE push_subscription');
    }
}
