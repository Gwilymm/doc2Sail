#!/bin/bash

# Script de déploiement SIMPLIFIÉ pour Raspberry Pi
# Cette version utilise rsync sans rebuild Docker

set -e

PI_HOST="marin@platypus-home"
PI_PROJECT_DIR="/var/www/doc2sail"

echo "🚀 Déploiement simplifié Doc2Sail"
echo "=================================="

# 1. Build les assets localement
echo ""
echo "📦 Étape 1: Build des assets JS/CSS..."
pnpm install
pnpm build

# 2. Installer les dépendances PHP
echo ""
echo "📦 Étape 2: Installation des dépendances PHP..."
composer install --no-dev --optimize-autoloader

# 3. Synchroniser les fichiers vers le Pi (SANS node_modules, var, vendor)
echo ""
echo "📤 Étape 3: Synchronisation vers le Pi..."
rsync -avz --delete \
    --exclude 'node_modules' \
    --exclude 'var/cache' \
    --exclude 'var/log' \
    --exclude '.git' \
    --exclude '.env.local' \
    ./ ${PI_HOST}:${PI_PROJECT_DIR}/

# 4. Copier vendor séparément (évite de re-télécharger toutes les dépendances)
echo ""
echo "📤 Étape 4: Synchronisation vendor..."
rsync -avz --delete \
    ./vendor/ ${PI_HOST}:${PI_PROJECT_DIR}/vendor/

# 5. Commandes sur le Pi
echo ""
echo "🔄 Étape 5: Finalisation sur le Pi..."

ssh ${PI_HOST} << 'ENDSSH'
cd /var/www/doc2sail

# Créer .env.local s'il n'existe pas
if [ ! -f .env.local ]; then
    echo "⚠️  Création de .env.local..."
    cat > .env.local << 'EOF'
APP_ENV=prod
APP_SECRET=$(openssl rand -hex 32)
DATABASE_URL="sqlite:///%kernel.project_dir%/var/data.db"
MERCURE_URL=http://mercure/.well-known/mercure
MERCURE_PUBLIC_URL=https://doc2sail.platypus-home.noho.st/.well-known/mercure
MERCURE_JWT_SECRET=$(openssl rand -hex 32)
EOF
fi

# Permissions
chown -R marin:marin /var/www/doc2sail
mkdir -p var/cache var/log public/uploads
chmod -R 775 var public/uploads

# Redémarrer Docker (sans rebuild)
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d

# Cache Symfony
docker compose -f docker-compose.prod.yml exec -T app php bin/console cache:clear --env=prod

echo "✅ Déploiement terminé"
ENDSSH

echo ""
echo "✅ Déploiement terminé avec succès !"
echo ""
echo "🌐 https://doc2sail.platypus-home.noho.st"
