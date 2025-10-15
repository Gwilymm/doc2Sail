<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20251014190832 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs

        // 1. S'assurer qu'il existe au moins un utilisateur
        $this->addSql("INSERT OR IGNORE INTO user (email_hash, display_name, created_at) 
                       VALUES ('\$argon2id\$v=19\$m=65536,t=4,p=1\$default\$hash', 'Administrateur', datetime('now'))");

        // 2. Récupérer l'ID du premier utilisateur
        $this->addSql("UPDATE regatta SET owner_id = (SELECT id FROM user ORDER BY id LIMIT 1) WHERE owner_id IS NULL");

        $this->addSql('CREATE TEMPORARY TABLE __temp__magic_link AS SELECT id, user_id, token, created_at, expires_at, used FROM magic_link');
        $this->addSql('DROP TABLE magic_link');
        $this->addSql('CREATE TABLE magic_link (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, user_id INTEGER NOT NULL, token VARCHAR(64) NOT NULL, created_at DATETIME NOT NULL --(DC2Type:datetime_immutable)
        , expires_at DATETIME NOT NULL --(DC2Type:datetime_immutable)
        , used BOOLEAN NOT NULL, FOREIGN KEY (user_id) REFERENCES user (id) ON UPDATE NO ACTION ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('INSERT INTO magic_link (id, user_id, token, created_at, expires_at, used) SELECT id, user_id, token, created_at, expires_at, used FROM __temp__magic_link');
        $this->addSql('DROP TABLE __temp__magic_link');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_6B40B1C65F37A13B ON magic_link (token)');
        $this->addSql('CREATE INDEX IDX_6B40B1C6A76ED395 ON magic_link (user_id)');
        $this->addSql('CREATE TEMPORARY TABLE __temp__regatta AS SELECT id, name, start_date, end_date, description, created_at, access_token, owner_id FROM regatta');
        $this->addSql('DROP TABLE regatta');
        $this->addSql('CREATE TABLE regatta (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, owner_id INTEGER NOT NULL, name VARCHAR(255) NOT NULL, start_date DATE NOT NULL, end_date DATE NOT NULL, description CLOB DEFAULT NULL, created_at DATETIME NOT NULL, access_token VARCHAR(64) DEFAULT NULL, CONSTRAINT FK_3434961E7E3C61F9 FOREIGN KEY (owner_id) REFERENCES "user" (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('INSERT INTO regatta (id, name, start_date, end_date, description, created_at, access_token, owner_id) SELECT id, name, start_date, end_date, description, created_at, access_token, owner_id FROM __temp__regatta');
        $this->addSql('DROP TABLE __temp__regatta');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_3434961EB6A2DD68 ON regatta (access_token)');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_3434961E5E237E06 ON regatta (name)');
        $this->addSql('CREATE INDEX IDX_3434961E7E3C61F9 ON regatta (owner_id)');
        $this->addSql('CREATE TEMPORARY TABLE __temp__user AS SELECT id, email_hash, display_name, created_at, last_login_at FROM user');
        $this->addSql('DROP TABLE user');
        $this->addSql('CREATE TABLE user (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, email_hash VARCHAR(255) NOT NULL, display_name VARCHAR(100) DEFAULT NULL, created_at DATETIME NOT NULL --(DC2Type:datetime_immutable)
        , last_login_at DATETIME DEFAULT NULL --(DC2Type:datetime_immutable)
        )');
        $this->addSql('INSERT INTO user (id, email_hash, display_name, created_at, last_login_at) SELECT id, email_hash, display_name, created_at, last_login_at FROM __temp__user');
        $this->addSql('DROP TABLE __temp__user');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_8D93D6494E8E423D ON user (email_hash)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TEMPORARY TABLE __temp__magic_link AS SELECT id, user_id, token, created_at, expires_at, used FROM magic_link');
        $this->addSql('DROP TABLE magic_link');
        $this->addSql('CREATE TABLE magic_link (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, user_id INTEGER NOT NULL, token VARCHAR(64) NOT NULL, created_at DATETIME NOT NULL, expires_at DATETIME NOT NULL, used BOOLEAN DEFAULT 0 NOT NULL, CONSTRAINT FK_6B40B1C6A76ED395 FOREIGN KEY (user_id) REFERENCES "user" (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('INSERT INTO magic_link (id, user_id, token, created_at, expires_at, used) SELECT id, user_id, token, created_at, expires_at, used FROM __temp__magic_link');
        $this->addSql('DROP TABLE __temp__magic_link');
        $this->addSql('CREATE INDEX IDX_magic_link_token ON magic_link (token)');
        $this->addSql('CREATE INDEX IDX_magic_link_user ON magic_link (user_id)');
        $this->addSql('CREATE TEMPORARY TABLE __temp__regatta AS SELECT id, owner_id, name, start_date, end_date, description, created_at, access_token FROM regatta');
        $this->addSql('DROP TABLE regatta');
        $this->addSql('CREATE TABLE regatta (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, owner_id INTEGER DEFAULT NULL, name VARCHAR(255) NOT NULL, start_date DATE NOT NULL, end_date DATE NOT NULL, description CLOB DEFAULT NULL, created_at DATETIME NOT NULL, access_token VARCHAR(64) DEFAULT NULL)');
        $this->addSql('INSERT INTO regatta (id, owner_id, name, start_date, end_date, description, created_at, access_token) SELECT id, owner_id, name, start_date, end_date, description, created_at, access_token FROM __temp__regatta');
        $this->addSql('DROP TABLE __temp__regatta');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_3434961EB6A2DD68 ON regatta (access_token)');
        $this->addSql('CREATE UNIQUE INDEX regatta_unique ON regatta (name, start_date)');
        $this->addSql('CREATE INDEX IDX_regatta_owner ON regatta (owner_id)');
        $this->addSql('CREATE TEMPORARY TABLE __temp__user AS SELECT id, email_hash, display_name, created_at, last_login_at FROM "user"');
        $this->addSql('DROP TABLE "user"');
        $this->addSql('CREATE TABLE "user" (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, email_hash VARCHAR(255) NOT NULL, display_name VARCHAR(100) DEFAULT NULL, created_at DATETIME NOT NULL, last_login_at DATETIME DEFAULT NULL)');
        $this->addSql('INSERT INTO "user" (id, email_hash, display_name, created_at, last_login_at) SELECT id, email_hash, display_name, created_at, last_login_at FROM __temp__user');
        $this->addSql('DROP TABLE __temp__user');
    }
}
