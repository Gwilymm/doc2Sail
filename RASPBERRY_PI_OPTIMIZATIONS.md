# 🐌 Optimisations Docker pour Raspberry Pi 5

## Problème
Docker build est très lent sur Raspberry Pi (ARM64) car :
- Les builds recompilent tout à chaque fois
- Installation de dépendances lourdes (PHP extensions, npm packages)
- Resources limitées (CPU, RAM)

## ✅ Solutions proposées

### Option 1 : Build sur votre machine locale puis transfert (Recommandé)

**Avantages** :
- Build rapide sur votre machine puissante
- Cross-compilation ARM64
- Transfert d'image pré-buildée

**Utilisation** :
```bash
# Rendre le script exécutable
chmod +x deploy-to-pi.sh

# Déployer
./deploy-to-pi.sh
```

Le script va :
1. Builder l'image Docker sur votre machine (avec buildx pour ARM64)
2. L'exporter en tar.gz
3. La transférer au Pi via scp
4. La charger et démarrer sur le Pi

**⚠️ Prérequis** : Docker buildx configuré pour ARM64
```bash
# Configuration buildx (une seule fois)
docker buildx create --name multiarch --driver docker-container --use
docker buildx inspect --bootstrap
```

---

### Option 2 : Déploiement sans Docker build (Plus rapide)

**Avantages** :
- Pas de build Docker sur le Pi
- Rsync synchronise seulement les fichiers modifiés
- Assets compilés sur votre machine locale

**Utilisation** :
```bash
# Rendre le script exécutable
chmod +x deploy-rsync.sh

# Déployer
./deploy-rsync.sh
```

Le script va :
1. Compiler assets JS/CSS sur votre machine
2. Installer vendor PHP sur votre machine
3. Rsync vers le Pi (uniquement les changements)
4. Redémarrer les conteneurs sans rebuild

---

### Option 3 : Optimiser le build directement sur le Pi

Si vous devez absolument builder sur le Pi, utilisez le `Dockerfile.prod` optimisé :

**Changements** :
- ✅ Image Alpine (plus légère)
- ✅ Multi-stage build (réduit la taille finale)
- ✅ Cache Docker layers intelligent
- ✅ Installation seulement des extensions PHP essentielles

**Sur le Raspberry Pi** :
```bash
cd /var/www/doc2sail

# Build avec cache (première fois sera longue)
docker compose -f docker-compose.prod.yml build

# Builds suivants seront plus rapides grâce au cache
docker compose -f docker-compose.prod.yml up -d
```

**Astuce** : Activer BuildKit pour des builds plus rapides
```bash
# Ajouter à ~/.bashrc ou ~/.zshrc sur le Pi
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1
```

---

## 🎯 Comparaison des options

| Option | Temps initial | Temps mise à jour | Complexité | Recommandé |
|--------|---------------|-------------------|------------|------------|
| **Option 1** (Build local + transfer) | ~5-10 min | ~3-5 min | Moyenne | ✅ Oui |
| **Option 2** (Rsync sans build) | ~2-3 min | ~1-2 min | Faible | ✅ Oui |
| **Option 3** (Build sur Pi) | ~30-60 min | ~20-40 min | Faible | ❌ Non |

---

## 📊 Monitoring et Optimisations supplémentaires

### Limiter les ressources Docker (déjà dans docker-compose.prod.yml)

```yaml
deploy:
  resources:
    limits:
      memory: 512M
    reservations:
      memory: 256M
```

### Vérifier l'utilisation des ressources

```bash
# Sur le Pi
ssh marin@platypus-home

# Voir l'utilisation CPU/RAM des conteneurs
docker stats

# Voir les logs
docker compose -f docker-compose.prod.yml logs -f
```

### Nettoyer le cache Docker régulièrement

```bash
# Sur le Pi
ssh marin@platypus-home

# Nettoyer les images inutilisées
docker image prune -a -f

# Nettoyer tout (volumes exclus)
docker system prune -a -f
```

---

## 🔧 Configuration recommandée pour le Raspberry Pi

### Augmenter le swap (si vous avez peu de RAM)

```bash
# Sur le Pi
sudo dphys-swapfile swapoff
sudo nano /etc/dphys-swapfile

# Changer CONF_SWAPSIZE à 2048 (2GB)
CONF_SWAPSIZE=2048

# Redémarrer le swap
sudo dphys-swapfile setup
sudo dphys-swapfile swapon
```

### Utiliser un SSD au lieu d'une carte SD

Les cartes SD sont lentes pour Docker. Si possible :
- Utilisez un SSD USB 3.0 pour stocker `/var/lib/docker`
- Montez-le automatiquement au démarrage

---

## 🎬 Workflow de développement recommandé

1. **Développement local** : Utilisez votre machine avec `docker compose up -d`
2. **Tests** : Testez en local
3. **Déploiement** : Utilisez `./deploy-rsync.sh` pour envoyer au Pi
4. **Mise à jour** : Re-exécutez le script après chaque modification

---

## ❓ Troubleshooting

### Le build est bloqué sur "apt-get update"
→ Problème DNS. Ajoutez `dns: [8.8.8.8, 8.8.4.4]` dans docker-compose.prod.yml

### Out of memory
→ Augmentez le swap ou réduisez les limits de mémoire dans docker-compose.prod.yml

### Image trop grosse
→ Utilisez le Dockerfile.prod qui utilise Alpine (plus léger que Debian)

### Rsync lent
→ Excluez plus de dossiers dans deploy-rsync.sh (node_modules, var, etc.)

---

## 📞 Support

Si aucune de ces solutions ne fonctionne :
1. Vérifiez `docker stats` sur le Pi pour voir l'utilisation des ressources
2. Regardez les logs : `docker compose logs -f`
3. Vérifiez l'espace disque : `df -h`
