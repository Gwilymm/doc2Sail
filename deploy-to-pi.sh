#!/bin/bash

# Script de déploiement optimisé pour Raspberry Pi
# Ce script build les assets en local et transfère tout au Pi

set -e

# Configuration
PI_HOST="marin@platypus-home"
PI_PROJECT_DIR="/var/www/doc2sail"
IMAGE_NAME="doc2sail-app"
IMAGE_TAG="latest"

echo "🚀 Déploiement Doc2Sail sur Raspberry Pi"
echo "========================================="

# Fonction pour afficher les erreurs
error_exit() {
    echo "❌ Erreur: $1"
    exit 1
}

# 1. Build les assets en local (Webpack Encore)
echo ""
echo "📦 Étape 1: Compilation des assets JS/CSS..."
pnpm install || error_exit "Échec de pnpm install"
pnpm build || error_exit "Échec de pnpm build"

echo "✅ Assets compilés avec succès"

# 2. Build l'image Docker localement pour ARM64
echo ""
echo "📦 Étape 2: Build de l'image Docker pour ARM64..."

# Vérifier que buildx est configuré
if ! docker buildx ls | grep -q "multiarch"; then
    echo "⚙️  Configuration de Docker buildx pour ARM64..."
    docker buildx create --name multiarch --driver docker-container --use
    docker buildx inspect --bootstrap
fi

docker buildx build \
    --platform linux/arm64 \
    --file Dockerfile.prod \
    --tag ${IMAGE_NAME}:${IMAGE_TAG} \
    --load \
    . || error_exit "Échec du build Docker"

echo "✅ Image buildée avec succès"

# 3. Sauvegarder l'image en tar
echo ""
echo "💾 Étape 3: Export de l'image..."
docker save ${IMAGE_NAME}:${IMAGE_TAG} | gzip > /tmp/${IMAGE_NAME}.tar.gz || error_exit "Échec de l'export"

echo "✅ Image exportée ($(du -h /tmp/${IMAGE_NAME}.tar.gz | cut -f1))"

# 4. Transférer les fichiers nécessaires au Pi
echo ""
echo "📤 Étape 4: Transfert vers le Raspberry Pi..."

# Créer le répertoire si nécessaire
ssh ${PI_HOST} "mkdir -p ${PI_PROJECT_DIR}" || error_exit "Impossible de créer le répertoire sur le Pi"

# Transférer l'image
echo "  → Transfert de l'image Docker..."
scp /tmp/${IMAGE_NAME}.tar.gz ${PI_HOST}:/tmp/ || error_exit "Échec du transfert de l'image"

# Transférer docker-compose.prod.yml
echo "  → Transfert de la configuration..."
scp docker-compose.prod.yml ${PI_HOST}:${PI_PROJECT_DIR}/ || error_exit "Échec du transfert docker-compose"

# Transférer .env.local si existe
if [ -f .env.local ]; then
    scp .env.local ${PI_HOST}:${PI_PROJECT_DIR}/.env.local
else
    echo "  ⚠️  .env.local non trouvé, à créer manuellement sur le Pi"
fi

echo "✅ Fichiers transférés"

# 5. Charger et démarrer sur le Pi
echo ""
echo "🔄 Étape 5: Déploiement sur le Raspberry Pi..."

ssh ${PI_HOST} << 'ENDSSH'
set -e

cd /var/www/doc2sail

echo "  → Chargement de l'image Docker..."
docker load < /tmp/doc2sail-app.tar.gz

echo "  → Arrêt des conteneurs existants..."
docker compose -f docker-compose.prod.yml down 2>/dev/null || true

echo "  → Démarrage des nouveaux conteneurs..."
docker compose -f docker-compose.prod.yml up -d

echo "  → Vérification du statut..."
sleep 3
docker compose -f docker-compose.prod.yml ps

echo "  → Nettoyage..."
rm -f /tmp/doc2sail-app.tar.gz
docker image prune -f

echo "✅ Déploiement terminé sur le Pi"
ENDSSH

# 6. Nettoyage local
echo ""
echo "🧹 Étape 6: Nettoyage local..."
rm -f /tmp/${IMAGE_NAME}.tar.gz

echo ""
echo "✅ Déploiement terminé avec succès !"
echo ""
echo "🌐 Votre application devrait être accessible sur:"
echo "   https://doc2sail.platypus-home.noho.st"
echo ""
echo "📊 Pour voir les logs:"
echo "   ssh ${PI_HOST} 'cd ${PI_PROJECT_DIR} && docker compose -f docker-compose.prod.yml logs -f'"
echo ""
