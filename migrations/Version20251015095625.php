<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20251015095625 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql("ALTER TABLE document ADD COLUMN category VARCHAR(100) DEFAULT 'Autre' NOT NULL");
        $this->addSql("UPDATE document SET category = 'Autre' WHERE category IS NULL");
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TEMPORARY TABLE __temp__document AS SELECT id, regatta_id, name, description, filename, mime_type, size, uploaded_at FROM document');
        $this->addSql('DROP TABLE document');
        $this->addSql('CREATE TABLE document (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, regatta_id INTEGER DEFAULT NULL, name VARCHAR(255) NOT NULL, description CLOB DEFAULT NULL, filename VARCHAR(255) NOT NULL, mime_type VARCHAR(255) NOT NULL, size INTEGER NOT NULL, uploaded_at DATETIME NOT NULL, CONSTRAINT FK_D8698A7676569257 FOREIGN KEY (regatta_id) REFERENCES regatta (id) ON DELETE SET NULL NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('INSERT INTO document (id, regatta_id, name, description, filename, mime_type, size, uploaded_at) SELECT id, regatta_id, name, description, filename, mime_type, size, uploaded_at FROM __temp__document');
        $this->addSql('DROP TABLE __temp__document');
        $this->addSql('CREATE INDEX IDX_D8698A7676569257 ON document (regatta_id)');
    }
}
