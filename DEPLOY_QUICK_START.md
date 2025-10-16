# 🚀 Guide de Déploiement Rapide sur Raspberry Pi

## 📋 Prérequis

Sur votre machine locale :
- Docker avec buildx installé
- pnpm installé
- Accès SSH au Raspberry Pi (`marin@platypus-home`)

Sur le Raspberry Pi :
- Docker et Docker Compose installés
- Répertoire `/var/www/doc2sail` créé

---

## ⚡ Méthode Recommandée : Deploy avec Build Local

Cette méthode est la plus rapide car elle :
1. Compile les assets JS/CSS sur votre machine puissante
2. Build l'image Docker pour ARM64 sur votre machine
3. Transfère l'image pré-compilée au Pi
4. Démarre les conteneurs sur le Pi

### Commandes

```bash
# Rendre le script exécutable (une seule fois)
chmod +x deploy-to-pi.sh

# Déployer
./deploy-to-pi.sh
```

**Temps estimé** : 5-10 minutes (première fois), 3-5 minutes (mises à jour)

---

## 🔧 Configuration initiale sur le Raspberry Pi

Si c'est votre première installation, créez le fichier `.env.local` sur le Pi :

```bash
ssh marin@platypus-home
cd /var/www/doc2sail

cat > .env.local << 'EOF'
APP_ENV=prod
APP_SECRET=$(openssl rand -hex 32)
DATABASE_URL="sqlite:///%kernel.project_dir%/var/data.db"

# Mercure
MERCURE_URL=http://mercure/.well-known/mercure
MERCURE_PUBLIC_URL=https://doc2sail.platypus-home.noho.st/.well-known/mercure
MERCURE_JWT_SECRET=$(openssl rand -hex 32)

# Mailer
MAILER_DSN=smtp://localhost:25
MAILER_FROM=noreply@doc2sail.platypus-home.noho.st

# VAPID (pour les notifications push)
VAPID_PUBLIC_KEY=votre_clé_publique
VAPID_PRIVATE_KEY=votre_clé_privée
VAPID_SUBJECT=mailto:admin@doc2sail.platypus-home.noho.st
EOF
```

Puis générez les clés VAPID si nécessaire :

```bash
# Sur votre machine locale
php bin/console webpush:generate:keys

# Copiez les clés dans .env.local sur le Pi
```

---

## 📦 Workflow de Développement

### 1. Développer en local

```bash
# Démarrer l'environnement de dev
docker compose up -d

# Watcher pour les assets
pnpm dev watch

# Accéder à l'app
# http://localhost:8000
```

### 2. Tester localement

```bash
# Compiler les assets pour production
pnpm build

# Tester avec l'image de production
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up
```

### 3. Déployer sur le Pi

```bash
# Déployer automatiquement
./deploy-to-pi.sh
```

---

## 🔍 Commandes Utiles

### Sur le Raspberry Pi

```bash
# Se connecter au Pi
ssh marin@platypus-home

# Voir les conteneurs actifs
cd /var/www/doc2sail
docker compose -f docker-compose.prod.yml ps

# Voir les logs
docker compose -f docker-compose.prod.yml logs -f

# Voir les logs d'un service spécifique
docker compose -f docker-compose.prod.yml logs -f app

# Redémarrer les services
docker compose -f docker-compose.prod.yml restart

# Arrêter les services
docker compose -f docker-compose.prod.yml down

# Vider le cache Symfony
docker compose -f docker-compose.prod.yml exec app php bin/console cache:clear --env=prod

# Voir l'utilisation des ressources
docker stats

# Nettoyer les images inutilisées
docker image prune -a -f
```

### Depuis votre machine locale

```bash
# Voir les logs à distance
ssh marin@platypus-home 'cd /var/www/doc2sail && docker compose -f docker-compose.prod.yml logs -f'

# Redémarrer à distance
ssh marin@platypus-home 'cd /var/www/doc2sail && docker compose -f docker-compose.prod.yml restart'

# Vider le cache à distance
ssh marin@platypus-home 'cd /var/www/doc2sail && docker compose -f docker-compose.prod.yml exec -T app php bin/console cache:clear --env=prod'
```

---

## 🐛 Dépannage

### Le script échoue sur "buildx not found"

Installez et configurez buildx :

```bash
# Installer buildx
docker buildx create --name multiarch --driver docker-container --use
docker buildx inspect --bootstrap
```

### L'image est trop grosse / le transfert est lent

Options :
1. Utilisez une meilleure connexion (ethernet au lieu de WiFi)
2. Compressez mieux : `docker save image | gzip -9 > image.tar.gz`
3. Utilisez `deploy-rsync.sh` qui ne transfère que les fichiers modifiés

### Le Pi est à court de mémoire

Réduisez les limites dans `docker-compose.prod.yml` :

```yaml
deploy:
  resources:
    limits:
      memory: 256M  # Au lieu de 512M
```

Ou augmentez le swap sur le Pi :

```bash
ssh marin@platypus-home
sudo dphys-swapfile swapoff
sudo nano /etc/dphys-swapfile
# Changer CONF_SWAPSIZE=2048
sudo dphys-swapfile setup
sudo dphys-swapfile swapon
```

### Les assets ne se chargent pas

Vérifiez que `public/build` existe et contient les fichiers :

```bash
ssh marin@platypus-home 'ls -la /var/www/doc2sail/public/build'
```

Si vide, relancez le build en local :

```bash
pnpm build
./deploy-to-pi.sh
```

---

## 📊 Monitoring

### Voir l'utilisation des ressources en temps réel

```bash
ssh marin@platypus-home 'docker stats'
```

### Voir l'espace disque

```bash
ssh marin@platypus-home 'df -h'
```

### Voir les logs d'erreurs Symfony

```bash
ssh marin@platypus-home 'cd /var/www/doc2sail && docker compose -f docker-compose.prod.yml exec app tail -f var/log/prod.log'
```

---

## 🎯 Checklist de Déploiement

- [ ] `.env.local` créé sur le Pi avec toutes les variables
- [ ] Clés VAPID générées et configurées
- [ ] Certificat SSL configuré dans Nginx (voir DEPLOYMENT.md)
- [ ] Base de données initialisée (`php bin/console doctrine:migrations:migrate`)
- [ ] Premier déploiement réussi (`./deploy-to-pi.sh`)
- [ ] Application accessible via https://doc2sail.platypus-home.noho.st
- [ ] Notifications temps réel fonctionnelles (Mercure)
- [ ] Notifications push testées (VAPID)

---

## 📞 Support

En cas de problème :
1. Vérifiez les logs : `docker compose logs -f`
2. Vérifiez l'espace disque : `df -h`
3. Vérifiez la RAM : `free -h`
4. Consultez `RASPBERRY_PI_OPTIMIZATIONS.md` pour plus de détails
