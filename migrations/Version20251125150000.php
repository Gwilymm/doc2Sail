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
        // Ajouter colonne short_code_hash
        $this->addSql('ALTER TABLE magic_link ADD short_code_hash VARCHAR(64) DEFAULT NULL');
        
        // Créer index sur short_code_hash
        $this->addSql('CREATE INDEX idx_magic_link_short_code_hash ON magic_link (short_code_hash)');
        
        // Migrer les données existantes : hasher les short_code actuels
        $this->addSql("UPDATE magic_link SET short_code_hash = SHA2(short_code, 256) WHERE short_code IS NOT NULL");
        
        // Rendre la colonne NOT NULL après migration
        $this->addSql('ALTER TABLE magic_link MODIFY short_code_hash VARCHAR(64) NOT NULL');
        
        // Supprimer l'ancien index sur short_code
        $this->addSql('DROP INDEX idx_magic_link_short_code ON magic_link');
        $this->addSql('DROP INDEX UNIQ_short_code ON magic_link');
        
        // Supprimer la colonne short_code (on garde uniquement le hash)
        $this->addSql('ALTER TABLE magic_link DROP short_code');
    }

    public function down(Schema $schema): void
    {
        // Restore short_code column
        $this->addSql('ALTER TABLE magic_link ADD short_code VARCHAR(6) DEFAULT NULL');
        
        // Note: Impossible de restaurer les codes originaux depuis le hash
        // Les codes existants seront perdus (acceptable car expiration 15min)
        
        $this->addSql('CREATE UNIQUE INDEX UNIQ_short_code ON magic_link (short_code)');
        $this->addSql('CREATE INDEX idx_magic_link_short_code ON magic_link (short_code)');
        
        $this->addSql('DROP INDEX idx_magic_link_short_code_hash ON magic_link');
        $this->addSql('ALTER TABLE magic_link DROP short_code_hash');
    }
}
