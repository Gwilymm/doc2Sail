<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20251014193135 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE regatta_invitation (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, regatta_id INTEGER NOT NULL, invited_by_id INTEGER NOT NULL, invited_email VARCHAR(255) NOT NULL, token VARCHAR(64) NOT NULL, created_at DATETIME NOT NULL --(DC2Type:datetime_immutable)
        , expires_at DATETIME NOT NULL --(DC2Type:datetime_immutable)
        , used BOOLEAN NOT NULL, CONSTRAINT FK_D0394AE076569257 FOREIGN KEY (regatta_id) REFERENCES regatta (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE, CONSTRAINT FK_D0394AE0A7B4A7E3 FOREIGN KEY (invited_by_id) REFERENCES "user" (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_D0394AE05F37A13B ON regatta_invitation (token)');
        $this->addSql('CREATE INDEX IDX_D0394AE076569257 ON regatta_invitation (regatta_id)');
        $this->addSql('CREATE INDEX IDX_D0394AE0A7B4A7E3 ON regatta_invitation (invited_by_id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('DROP TABLE regatta_invitation');
    }
}
