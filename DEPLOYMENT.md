# 🚀 Guide de Déploiement Doc2Sail sur Raspberry Pi + YunoHost

Ce guide vous explique comment déployer Doc2Sail sur votre Raspberry Pi avec YunoHost et le rendre accessible sur `doc2sail.platypus-home.noho.st`.

## 📋 Prérequis

- Raspberry Pi (3B+ ou supérieur recommandé) avec YunoHost installé
- Domaine : `doc2sail.platypus-home.noho.st`
- Accès SSH à votre Raspberry Pi
- Docker et Docker Compose installés sur le Raspberry Pi
- Minimum 2GB RAM (4GB recommandé)

---

## 🔧 Étape 1 : Préparation du Raspberry Pi

### 1.1 Connexion SSH

```bash
ssh admin@platypus-home.noho.st
# Ou utilisez l'IP locale si vous êtes sur le même réseau
ssh admin@192.168.x.x
```

### 1.2 Installer Docker et Docker Compose

```bash
# Installer Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Ajouter l'utilisateur au groupe docker
sudo usermod -aG docker $USER

# Installer Docker Compose
sudo apt-get update
sudo apt-get install -y docker-compose

# Vérifier l'installation
docker --version
docker-compose --version
```

### 1.3 Créer le répertoire de l'application

```bash
sudo mkdir -p /var/www/doc2sail
sudo chown -R $USER:$USER /var/www/doc2sail
cd /var/www/doc2sail
```

---

## 📦 Étape 2 : Déployer l'Application

### 2.1 Cloner le repository (ou transférer les fichiers)

**Option A : Clone depuis Git**
```bash
cd /var/www/doc2sail
git clone https://github.com/Gwilymm/doc2Sail.git .
```

**Option B : Transfert depuis votre machine locale**
```bash
# Sur votre machine locale
rsync -avz --exclude 'node_modules' --exclude 'var' --exclude 'vendor' \
  /home/gwilym/Documents/Perso/doc2Sail/ \
  admin@platypus-home.noho.st:/var/www/doc2sail/
```

### 2.2 Configuration de l'environnement de production

```bash
cd /var/www/doc2sail

# Copier le fichier d'environnement
cp .env.prod.example .env.local

# Éditer les variables d'environnement
nano .env.local
```

**Configurez les valeurs suivantes dans `.env.local` :**

```env
APP_ENV=prod
APP_SECRET=$(openssl rand -hex 32)

# Base de données - Utiliser SQLite ou MySQL selon vos besoins
DATABASE_URL="sqlite:///%kernel.project_dir%/var/data.db"

# Mercure - Utiliser le domaine YunoHost
MERCURE_URL=http://localhost:3000/.well-known/mercure
MERCURE_PUBLIC_URL=https://doc2sail.platypus-home.noho.st/.well-known/mercure
MERCURE_JWT_SECRET=$(openssl rand -hex 32)

# Mailer - Configurer avec votre serveur SMTP
MAILER_DSN=smtp://localhost:25
MAILER_FROM=noreply@doc2sail.platypus-home.noho.st

# VAPID Keys - Garder les mêmes ou en générer de nouvelles
VAPID_PUBLIC_KEY="votre-clé-publique"
VAPID_PRIVATE_KEY="votre-clé-privée"
VAPID_SUBJECT="mailto:admin@doc2sail.platypus-home.noho.st"
```

### 2.3 Modifier docker-compose.yml pour la production

Créer un fichier `docker-compose.prod.yml` :

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: doc2sail-app
    restart: unless-stopped
    ports:
      - "127.0.0.1:8000:8000"
    volumes:
      - ./:/app
      - app-var:/app/var
      - app-vendor:/app/vendor
      - app-public-uploads:/app/public/uploads
    environment:
      - APP_ENV=prod
      - DATABASE_URL=${DATABASE_URL}
    networks:
      - doc2sail-network

  mercure:
    image: dunglas/mercure:latest
    container_name: doc2sail-mercure
    restart: unless-stopped
    command: /usr/bin/caddy run --config /etc/caddy/Caddyfile.dev
    ports:
      - "127.0.0.1:3000:80"
    environment:
      - SERVER_NAME=:80
      - MERCURE_PUBLISHER_JWT_KEY=${MERCURE_JWT_SECRET}
      - MERCURE_SUBSCRIBER_JWT_KEY=${MERCURE_JWT_SECRET}
      - MERCURE_EXTRA_DIRECTIVES=cors_origins https://doc2sail.platypus-home.noho.st
    networks:
      - doc2sail-network

volumes:
  app-var:
  app-vendor:
  app-public-uploads:

networks:
  doc2sail-network:
    driver: bridge
```

### 2.4 Build et démarrer les conteneurs

```bash
# Build les images Docker
docker-compose -f docker-compose.prod.yml build

# Démarrer les services
docker-compose -f docker-compose.prod.yml up -d

# Vérifier que les conteneurs sont en cours d'exécution
docker-compose -f docker-compose.prod.yml ps
```

### 2.5 Installation des dépendances

```bash
# Entrer dans le conteneur
docker-compose -f docker-compose.prod.yml exec app bash

# Installer les dépendances PHP
composer install --no-dev --optimize-autoloader

# Installer les dépendances JS et compiler les assets
npm install
npm run build
# Ou avec pnpm
pnpm install
pnpm build

# Créer/migrer la base de données
php bin/console doctrine:database:create --if-not-exists
php bin/console doctrine:migrations:migrate --no-interaction

# Vider le cache
php bin/console cache:clear --env=prod
php bin/console cache:warmup --env=prod

# Définir les permissions
chown -R www-data:www-data /app/var
chown -R www-data:www-data /app/public/uploads

# Sortir du conteneur
exit
```

---

## 🌐 Étape 3 : Configuration de YunoHost et du Reverse Proxy

### 3.1 Ajouter le domaine dans YunoHost

```bash
# Via l'interface web YunoHost
# Administration > Domaines > Ajouter un domaine
# Entrer : doc2sail.platypus-home.noho.st

# Ou via CLI
sudo yunohost domain add doc2sail.platypus-home.noho.st
```

### 3.2 Installer et configurer le certificat SSL

```bash
# YunoHost utilise Let's Encrypt automatiquement
sudo yunohost domain cert-install doc2sail.platypus-home.noho.st
```

### 3.3 Configurer Nginx comme reverse proxy

Créer le fichier de configuration Nginx :

```bash
sudo nano /etc/nginx/conf.d/doc2sail.conf
```

**Contenu du fichier :**

```nginx
# Configuration pour Doc2Sail
server {
    listen 80;
    listen [::]:80;
    server_name doc2sail.platypus-home.noho.st;

    # Redirection HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name doc2sail.platypus-home.noho.st;

    # Certificats SSL (gérés par YunoHost)
    ssl_certificate /etc/yunohost/certs/doc2sail.platypus-home.noho.st/crt.pem;
    ssl_certificate_key /etc/yunohost/certs/doc2sail.platypus-home.noho.st/key.pem;

    # Logs
    access_log /var/log/nginx/doc2sail.access.log;
    error_log /var/log/nginx/doc2sail.error.log;

    # Taille maximale des fichiers uploadés
    client_max_body_size 100M;

    # Proxy vers l'application Symfony
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Proxy pour Mercure (Server-Sent Events)
    location /.well-known/mercure {
        proxy_pass http://127.0.0.1:3000/.well-known/mercure;
        proxy_http_version 1.1;
        
        # Configuration SSE (Server-Sent Events)
        proxy_set_header Connection '';
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Désactiver le buffering pour SSE
        proxy_buffering off;
        proxy_cache off;
        
        # Timeouts élevés pour les connexions SSE longues
        proxy_read_timeout 24h;
        proxy_connect_timeout 75s;
        
        # Heartbeat
        chunked_transfer_encoding on;
    }

    # Cache des assets statiques
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://127.0.0.1:8000;
        proxy_cache_valid 200 1d;
        expires 1d;
        add_header Cache-Control "public, immutable";
    }
}
```

### 3.4 Tester et recharger Nginx

```bash
# Tester la configuration
sudo nginx -t

# Recharger Nginx
sudo systemctl reload nginx
```

---

## 🔒 Étape 4 : Sécurité et Optimisations

### 4.1 Firewall (si pas déjà configuré par YunoHost)

```bash
# Vérifier le firewall
sudo yunohost firewall list

# YunoHost devrait déjà autoriser les ports 80 et 443
```

### 4.2 Créer un script de démarrage automatique

```bash
sudo nano /etc/systemd/system/doc2sail.service
```

**Contenu :**

```ini
[Unit]
Description=Doc2Sail PWA Application
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/var/www/doc2sail
ExecStart=/usr/bin/docker-compose -f docker-compose.prod.yml up -d
ExecStop=/usr/bin/docker-compose -f docker-compose.prod.yml down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
```

**Activer le service :**

```bash
sudo systemctl daemon-reload
sudo systemctl enable doc2sail.service
sudo systemctl start doc2sail.service
```

### 4.3 Sauvegardes automatiques

Créer un script de sauvegarde :

```bash
sudo nano /usr/local/bin/backup-doc2sail.sh
```

**Contenu :**

```bash
#!/bin/bash

# Configuration
BACKUP_DIR="/var/backups/doc2sail"
APP_DIR="/var/www/doc2sail"
DATE=$(date +%Y%m%d_%H%M%S)

# Créer le répertoire de sauvegarde
mkdir -p "$BACKUP_DIR"

# Sauvegarder la base de données
docker-compose -f "$APP_DIR/docker-compose.prod.yml" exec -T app \
    php bin/console doctrine:database:export > "$BACKUP_DIR/db_$DATE.sql" 2>/dev/null || \
    cp "$APP_DIR/var/data.db" "$BACKUP_DIR/data_$DATE.db"

# Sauvegarder les uploads
tar -czf "$BACKUP_DIR/uploads_$DATE.tar.gz" -C "$APP_DIR/public" uploads

# Sauvegarder la configuration
cp "$APP_DIR/.env.local" "$BACKUP_DIR/env_$DATE.backup"

# Garder seulement les 30 dernières sauvegardes
find "$BACKUP_DIR" -type f -mtime +30 -delete

echo "Backup completed: $DATE"
```

**Rendre exécutable et ajouter à cron :**

```bash
sudo chmod +x /usr/local/bin/backup-doc2sail.sh

# Ajouter au crontab (sauvegarde quotidienne à 2h du matin)
sudo crontab -e
# Ajouter la ligne :
# 0 2 * * * /usr/local/bin/backup-doc2sail.sh >> /var/log/doc2sail-backup.log 2>&1
```

---

## 📊 Étape 5 : Monitoring et Maintenance

### 5.1 Vérifier les logs

```bash
# Logs de l'application
docker-compose -f docker-compose.prod.yml logs -f app

# Logs Mercure
docker-compose -f docker-compose.prod.yml logs -f mercure

# Logs Nginx
sudo tail -f /var/log/nginx/doc2sail.access.log
sudo tail -f /var/log/nginx/doc2sail.error.log
```

### 5.2 Commandes utiles

```bash
# Redémarrer l'application
docker-compose -f docker-compose.prod.yml restart

# Mettre à jour l'application
cd /var/www/doc2sail
git pull
docker-compose -f docker-compose.prod.yml exec app composer install --no-dev
docker-compose -f docker-compose.prod.yml exec app pnpm install
docker-compose -f docker-compose.prod.yml exec app pnpm build
docker-compose -f docker-compose.prod.yml exec app php bin/console cache:clear --env=prod
docker-compose -f docker-compose.prod.yml restart app

# Vider le cache Symfony
docker-compose -f docker-compose.prod.yml exec app php bin/console cache:clear --env=prod

# Voir l'utilisation des ressources
docker stats

# Nettoyer les anciens conteneurs/images
docker system prune -a
```

---

## 🧪 Étape 6 : Tests de Validation

### 6.1 Vérifier l'accès

```bash
# Depuis un navigateur, accéder à :
https://doc2sail.platypus-home.noho.st

# Tester le certificat SSL
curl -I https://doc2sail.platypus-home.noho.st
```

### 6.2 Tester les notifications Mercure

```bash
# Créer une régate et uploader un document
# Ouvrir la page publique sur un autre appareil
# Vérifier que les notifications en temps réel fonctionnent
```

### 6.3 Tester les notifications Push

```bash
# Sur mobile, installer la PWA
# Activer les notifications push
# Uploader un document depuis l'admin
# Vérifier que la notification push arrive sur le mobile
```

---

## 🔧 Dépannage

### Problème : L'application ne démarre pas

```bash
# Vérifier les logs
docker-compose -f docker-compose.prod.yml logs app

# Vérifier les permissions
sudo chown -R www-data:www-data /var/www/doc2sail/var
sudo chown -R www-data:www-data /var/www/doc2sail/public/uploads
```

### Problème : Mercure ne fonctionne pas

```bash
# Vérifier que le conteneur Mercure est actif
docker-compose -f docker-compose.prod.yml ps mercure

# Vérifier les logs Mercure
docker-compose -f docker-compose.prod.yml logs mercure

# Vérifier la configuration CORS dans docker-compose.prod.yml
```

### Problème : Certificat SSL invalide

```bash
# Renouveler le certificat
sudo yunohost domain cert-renew doc2sail.platypus-home.noho.st --force

# Vérifier les permissions du certificat
sudo ls -la /etc/yunohost/certs/doc2sail.platypus-home.noho.st/
```

### Problème : Upload de fichiers échoue

```bash
# Vérifier la configuration PHP
docker-compose -f docker-compose.prod.yml exec app php -i | grep upload_max_filesize
docker-compose -f docker-compose.prod.yml exec app php -i | grep post_max_size

# Modifier dans Dockerfile si nécessaire et rebuild
```

---

## 📝 Performance et Optimisations

### Utiliser OPcache en production

L'image Docker inclut déjà OPcache. Vérifier :

```bash
docker-compose -f docker-compose.prod.yml exec app php -m | grep opcache
```

### Optimiser la base de données

Pour de meilleures performances, utilisez MySQL/PostgreSQL au lieu de SQLite :

```bash
# Ajouter un service MySQL dans docker-compose.prod.yml
# Mettre à jour DATABASE_URL dans .env.local
# Exporter les données de SQLite et les importer dans MySQL
```

### CDN pour les assets (optionnel)

Pour de très hautes performances, considérez un CDN pour servir les assets statiques.

---

## 🎯 Résumé des URLs

- **Application principale** : https://doc2sail.platypus-home.noho.st
- **Page publique d'une régate** : https://doc2sail.platypus-home.noho.st/r/{token}
- **API Push** : https://doc2sail.platypus-home.noho.st/api/push/*
- **Mercure Hub** : https://doc2sail.platypus-home.noho.st/.well-known/mercure

---

## 📞 Support

En cas de problème :
1. Vérifier les logs (`docker-compose logs`)
2. Vérifier la configuration Nginx (`sudo nginx -t`)
3. Vérifier les certificats SSL
4. Consulter la documentation YunoHost : https://yunohost.org/docs

---

**🎉 Félicitations ! Votre application Doc2Sail est maintenant déployée et accessible sur https://doc2sail.platypus-home.noho.st**
