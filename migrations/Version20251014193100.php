<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20251014193100 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE regatta_co_owners (regatta_id INTEGER NOT NULL, user_id INTEGER NOT NULL, PRIMARY KEY(regatta_id, user_id), CONSTRAINT FK_3CDE46EB76569257 FOREIGN KEY (regatta_id) REFERENCES regatta (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE, CONSTRAINT FK_3CDE46EBA76ED395 FOREIGN KEY (user_id) REFERENCES "user" (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('CREATE INDEX IDX_3CDE46EB76569257 ON regatta_co_owners (regatta_id)');
        $this->addSql('CREATE INDEX IDX_3CDE46EBA76ED395 ON regatta_co_owners (user_id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('DROP TABLE regatta_co_owners');
    }
}
