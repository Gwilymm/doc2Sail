#!/bin/bash

# 🚀 Script de déploiement Doc2Sail
# Ce script aide à déployer Doc2Sail sur un serveur de production

set -e

echo "🚀 Doc2Sail - Script de Déploiement"
echo "===================================="
echo ""

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Variables
APP_DIR="/var/www/doc2sail"
COMPOSE_FILE="docker-compose.prod.yml"

# Fonctions
function info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

function warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

function error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

function check_requirements() {
    info "Vérification des prérequis..."
    
    if ! command -v docker &> /dev/null; then
        error "Docker n'est pas installé. Installez-le avec: curl -fsSL https://get.docker.com | sh"
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose n'est pas installé. Installez-le avec: apt-get install docker-compose"
    fi
    
    info "✓ Docker et Docker Compose sont installés"
}

function create_directories() {
    info "Création des répertoires..."
    
    sudo mkdir -p "$APP_DIR"
    sudo mkdir -p "$APP_DIR/var/log"
    sudo mkdir -p "$APP_DIR/public/uploads/documents"
    sudo mkdir -p /var/backups/doc2sail
    
    info "✓ Répertoires créés"
}

function setup_environment() {
    info "Configuration de l'environnement..."
    
    if [ ! -f "$APP_DIR/.env.local" ]; then
        if [ -f "$APP_DIR/.env.prod.example" ]; then
            cp "$APP_DIR/.env.prod.example" "$APP_DIR/.env.local"
            warn "Fichier .env.local créé. MODIFIEZ-LE avec vos valeurs de production !"
            warn "Important: APP_SECRET, MERCURE_JWT_SECRET, VAPID keys"
        else
            error "Fichier .env.prod.example non trouvé"
        fi
    else
        info "✓ Fichier .env.local existe déjà"
    fi
}

function build_containers() {
    info "Construction des conteneurs Docker..."
    
    cd "$APP_DIR"
    docker-compose -f "$COMPOSE_FILE" build --no-cache
    
    info "✓ Conteneurs construits"
}

function install_dependencies() {
    info "Installation des dépendances..."
    
    docker-compose -f "$COMPOSE_FILE" run --rm app composer install --no-dev --optimize-autoloader
    docker-compose -f "$COMPOSE_FILE" run --rm app pnpm install
    docker-compose -f "$COMPOSE_FILE" run --rm app pnpm build
    
    info "✓ Dépendances installées"
}

function setup_database() {
    info "Configuration de la base de données..."
    
    docker-compose -f "$COMPOSE_FILE" up -d app
    sleep 5
    
    docker-compose -f "$COMPOSE_FILE" exec -T app php bin/console doctrine:database:create --if-not-exists
    docker-compose -f "$COMPOSE_FILE" exec -T app php bin/console doctrine:migrations:migrate --no-interaction
    
    info "✓ Base de données configurée"
}

function clear_cache() {
    info "Nettoyage du cache..."
    
    docker-compose -f "$COMPOSE_FILE" exec -T app php bin/console cache:clear --env=prod
    docker-compose -f "$COMPOSE_FILE" exec -T app php bin/console cache:warmup --env=prod
    
    info "✓ Cache nettoyé"
}

function set_permissions() {
    info "Configuration des permissions..."
    
    docker-compose -f "$COMPOSE_FILE" exec -T app chown -R www-data:www-data /app/var
    docker-compose -f "$COMPOSE_FILE" exec -T app chown -R www-data:www-data /app/public/uploads
    
    info "✓ Permissions configurées"
}

function start_services() {
    info "Démarrage des services..."
    
    docker-compose -f "$COMPOSE_FILE" up -d
    
    info "✓ Services démarrés"
}

function show_status() {
    info "État des services:"
    docker-compose -f "$COMPOSE_FILE" ps
    
    echo ""
    info "Logs récents de l'application:"
    docker-compose -f "$COMPOSE_FILE" logs --tail=20 app
}

function create_systemd_service() {
    info "Création du service systemd..."
    
    cat > /tmp/doc2sail.service <<EOF
[Unit]
Description=Doc2Sail PWA Application
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=$APP_DIR
ExecStart=/usr/bin/docker-compose -f $COMPOSE_FILE up -d
ExecStop=/usr/bin/docker-compose -f $COMPOSE_FILE down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF
    
    sudo mv /tmp/doc2sail.service /etc/systemd/system/doc2sail.service
    sudo systemctl daemon-reload
    sudo systemctl enable doc2sail.service
    
    info "✓ Service systemd créé et activé"
}

function setup_backup_cron() {
    info "Configuration des sauvegardes automatiques..."
    
    cat > /tmp/backup-doc2sail.sh <<'EOF'
#!/bin/bash
BACKUP_DIR="/var/backups/doc2sail"
APP_DIR="/var/www/doc2sail"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p "$BACKUP_DIR"

# Backup database
cp "$APP_DIR/var/data.db" "$BACKUP_DIR/data_$DATE.db" 2>/dev/null || true

# Backup uploads
tar -czf "$BACKUP_DIR/uploads_$DATE.tar.gz" -C "$APP_DIR/public" uploads

# Backup config
cp "$APP_DIR/.env.local" "$BACKUP_DIR/env_$DATE.backup"

# Keep only last 30 backups
find "$BACKUP_DIR" -type f -mtime +30 -delete

echo "Backup completed: $DATE"
EOF
    
    sudo mv /tmp/backup-doc2sail.sh /usr/local/bin/backup-doc2sail.sh
    sudo chmod +x /usr/local/bin/backup-doc2sail.sh
    
    # Add to crontab
    (sudo crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/backup-doc2sail.sh >> /var/log/doc2sail-backup.log 2>&1") | sudo crontab -
    
    info "✓ Sauvegardes automatiques configurées (quotidien à 2h)"
}

function run_health_check() {
    info "Vérification de santé de l'application..."
    
    sleep 5
    
    if curl -f http://localhost:8000 > /dev/null 2>&1; then
        info "✓ L'application répond sur le port 8000"
    else
        warn "L'application ne répond pas encore sur le port 8000"
    fi
}

# Menu principal
function main_menu() {
    echo ""
    echo "Que voulez-vous faire ?"
    echo "1) Installation complète (première installation)"
    echo "2) Mise à jour de l'application"
    echo "3) Redémarrer les services"
    echo "4) Voir les logs"
    echo "5) Voir le statut"
    echo "6) Sauvegarder maintenant"
    echo "7) Nettoyer (images Docker, cache, etc.)"
    echo "0) Quitter"
    echo ""
    read -p "Votre choix: " choice
    
    case $choice in
        1)
            full_installation
            ;;
        2)
            update_application
            ;;
        3)
            restart_services
            ;;
        4)
            view_logs
            ;;
        5)
            show_status
            main_menu
            ;;
        6)
            backup_now
            ;;
        7)
            cleanup
            ;;
        0)
            info "Au revoir !"
            exit 0
            ;;
        *)
            error "Choix invalide"
            ;;
    esac
}

function full_installation() {
    info "🚀 Installation complète de Doc2Sail"
    
    check_requirements
    create_directories
    setup_environment
    
    warn "⚠️  IMPORTANT: Avez-vous modifié le fichier .env.local avec vos valeurs de production ?"
    read -p "Continuer ? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        error "Installation annulée. Modifiez .env.local et relancez."
    fi
    
    build_containers
    install_dependencies
    setup_database
    clear_cache
    set_permissions
    start_services
    create_systemd_service
    setup_backup_cron
    run_health_check
    
    info "✅ Installation terminée !"
    info "Accédez à votre application sur: https://doc2sail.platypus-home.noho.st"
    info "N'oubliez pas de configurer Nginx comme décrit dans DEPLOYMENT.md"
}

function update_application() {
    info "🔄 Mise à jour de l'application"
    
    cd "$APP_DIR"
    
    # Pull latest code
    if [ -d ".git" ]; then
        info "Pull du code depuis Git..."
        git pull
    else
        warn "Pas de repository Git trouvé, sautant le pull"
    fi
    
    # Update dependencies
    install_dependencies
    
    # Migrate database
    docker-compose -f "$COMPOSE_FILE" exec -T app php bin/console doctrine:migrations:migrate --no-interaction
    
    # Clear cache
    clear_cache
    
    # Restart
    docker-compose -f "$COMPOSE_FILE" restart app
    
    info "✅ Mise à jour terminée !"
    show_status
}

function restart_services() {
    info "🔄 Redémarrage des services..."
    
    cd "$APP_DIR"
    docker-compose -f "$COMPOSE_FILE" restart
    
    info "✅ Services redémarrés !"
    show_status
}

function view_logs() {
    cd "$APP_DIR"
    
    echo ""
    echo "Logs de quel service ?"
    echo "1) app"
    echo "2) mercure"
    echo "3) tous"
    read -p "Votre choix: " log_choice
    
    case $log_choice in
        1)
            docker-compose -f "$COMPOSE_FILE" logs -f --tail=100 app
            ;;
        2)
            docker-compose -f "$COMPOSE_FILE" logs -f --tail=100 mercure
            ;;
        3)
            docker-compose -f "$COMPOSE_FILE" logs -f --tail=100
            ;;
        *)
            error "Choix invalide"
            ;;
    esac
}

function backup_now() {
    info "💾 Sauvegarde en cours..."
    
    /usr/local/bin/backup-doc2sail.sh
    
    info "✅ Sauvegarde terminée !"
    ls -lh /var/backups/doc2sail/ | tail -5
}

function cleanup() {
    info "🧹 Nettoyage..."
    
    cd "$APP_DIR"
    
    warn "Ceci va supprimer les images Docker inutilisées. Continuer ?"
    read -p "(y/n) " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker system prune -a -f
        docker-compose -f "$COMPOSE_FILE" exec -T app php bin/console cache:clear --env=prod
        info "✅ Nettoyage terminé !"
    else
        info "Nettoyage annulé"
    fi
}

# Exécution
if [ "$EUID" -ne 0 ]; then 
    warn "Ce script doit être exécuté avec sudo pour certaines opérations"
fi

main_menu
