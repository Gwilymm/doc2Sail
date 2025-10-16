# 🔑 Correction SSH GitHub sur Raspberry Pi

## Problème
L'utilisateur `marin` sur `platypus-home` ne peut pas s'authentifier avec GitHub via SSH.

## Solution

### Étape 1 : Configurer le fichier SSH config sur le Raspberry Pi

Connectez-vous au Raspberry Pi et créez/modifiez le fichier SSH config :

```bash
ssh marin@platypus-home
cd ~/.ssh
nano config
```

Ajoutez cette configuration :

```
Host github.com
    HostName github.com
    User git
    IdentityFile ~/.ssh/github
    IdentitiesOnly yes
```

Sauvegardez (Ctrl+O, Enter, Ctrl+X).

### Étape 2 : Vérifier les permissions des clés

```bash
chmod 600 ~/.ssh/github
chmod 644 ~/.ssh/github.pub
chmod 600 ~/.ssh/config
```

### Étape 3 : Ajouter la clé publique à GitHub

Si ce n'est pas déjà fait, vous devez ajouter la clé publique à votre compte GitHub :

```bash
# Afficher la clé publique
cat ~/.ssh/github.pub
```

Copiez le contenu complet (commence par `ssh-ed25519` ou `ssh-rsa`).

Puis :
1. Allez sur https://github.com/settings/keys
2. Cliquez sur "New SSH key"
3. Titre : `Raspberry Pi platypus-home`
4. Collez la clé publique
5. Cliquez "Add SSH key"

### Étape 4 : Tester la connexion

```bash
ssh -T git@github.com
```

Vous devriez voir :
```
Hi Gwilymm! You've successfully authenticated, but GitHub does not provide shell access.
```

### Étape 5 : Vérifier/Configurer le remote Git

Dans le répertoire du projet :

```bash
cd /var/www/doc2sail

# Vérifier le remote actuel
git remote -v

# Si le remote utilise HTTPS, changez-le en SSH
git remote set-url origin git@github.com:Gwilymm/doc2Sail.git
```

### Étape 6 : Tester un git pull

```bash
git pull origin master
```

## Alternative : Déploiement sans Git

Si vous préférez ne pas utiliser Git sur le Raspberry Pi, vous pouvez :

### Option A : Utiliser rsync depuis votre machine locale

Créez un script de déploiement sur votre machine locale :

```bash
#!/bin/bash
# deploy-to-pi.sh

echo "🚀 Déploiement vers Raspberry Pi..."

# Sync les fichiers
rsync -avz --exclude 'node_modules' \
  --exclude 'var/cache' \
  --exclude 'var/log' \
  --exclude 'vendor' \
  --exclude '.git' \
  /home/gwilym/Documents/Perso/doc2Sail/ \
  marin@platypus-home:/var/www/doc2sail/

# Rebuild sur le Pi
ssh marin@platypus-home << 'EOF'
cd /var/www/doc2sail
docker compose build
docker compose up -d
docker compose exec app php bin/console cache:clear --env=prod
EOF

echo "✅ Déploiement terminé !"
```

Rendez-le exécutable :
```bash
chmod +x deploy-to-pi.sh
```

### Option B : Utiliser un webhook GitHub

Configurez un webhook qui déclenche un script de déploiement automatique sur le Pi quand vous pushez sur `master`.

## Commandes de diagnostic

Si le problème persiste :

```bash
# Vérifier l'agent SSH
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/github

# Tester avec verbose
ssh -vT git@github.com

# Vérifier les permissions du dossier .ssh
ls -la ~/.ssh/
```

## Notes importantes

- La clé `github` doit être privée (permissions 600)
- La clé `github.pub` doit être publique (permissions 644)
- Le fichier `config` doit être lisible uniquement par vous (600)
- Ne partagez JAMAIS votre clé privée (`github`)
- Seule la clé publique (`github.pub`) doit être ajoutée sur GitHub

## Support

Si vous rencontrez toujours des problèmes :
1. Vérifiez que vous n'avez pas de firewall bloquant le port 22
2. Vérifiez que GitHub n'est pas bloqué sur votre réseau
3. Essayez de régénérer une nouvelle paire de clés si nécessaire
