<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20251125134024 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'No-op: short_code_hash migration is handled by Version20251125150000';
    }

    public function up(Schema $schema): void
    {
        // This generated migration was invalid for SQLite because it selected
        // short_code_hash before the column existed. The actual conversion from
        // short_code to short_code_hash is performed by Version20251125150000.
    }

    public function down(Schema $schema): void
    {
        // No-op; see up().
    }
}
