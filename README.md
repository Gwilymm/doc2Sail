# 📱 Doc2Sail - PWA de Gestion de Documents de Régate

Application PWA Symfony pour gérer des documents de régate de voile.

## 🚀 Fonctionnalités

- ⛵ **Deux interfaces** :
  - `/` - Page de consultation (lecture seule)
  - `/admin` - Page d'administration (upload + suppression)

- 📁 **Gestion de documents** :
  - Upload par drag & drop
  - Support : PDF, Word, Excel, Images (max 10MB)
  - Métadonnées : nom, description, taille, date
  - Recherche en temps réel

- 📱 **PWA** :
  - Installable sur mobile et desktop
  - Mode offline
  - Service Worker
  - Icône personnalisée

## 🛠️ Technologies

- **Backend** : Symfony 7.3 + Doctrine + SQLite
- **Frontend** : Tailwind CSS 4 + DaisyUI
- **JS** : Stimulus + Turbo
- **Build** : Webpack Encore

## 📦 Installation

```bash
# Cloner le projet
cd /home/gwilym/Documents/Perso/doc2Sail

# Installer les dépendances PHP
composer install

# Installer les dépendances Node
pnpm install

# Créer la base de données
php bin/console doctrine:database:create
php bin/console doctrine:migrations:migrate

# Compiler les assets
pnpm run dev
# ou en mode watch
pnpm run watch
```

## 🚀 Démarrage

```bash
# Démarrer le serveur Symfony
symfony server:start

# Ou avec php.ini personnalisé
php -c php.ini -S localhost:8000 -t public/

# Accéder à l'application
# Consultation : http://localhost:8000/
# Administration : http://localhost:8000/admin
```

## 📂 Structure

```
doc2Sail/
├── assets/               # Sources JS/CSS
│   ├── app.js
│   ├── styles/app.css
│   └── controllers/      # Stimulus controllers
├── public/
│   ├── uploads/         # Documents uploadés
│   ├── manifest.json    # PWA manifest
│   └── sw.js           # Service Worker
├── src/
│   ├── Controller/      # DocumentController
│   ├── Entity/         # Document entity
│   ├── Repository/     # DocumentRepository
│   └── Service/        # DocumentUploader
├── templates/
│   └── document/
│       ├── index.html.twig  # Page consultation
│       └── admin.html.twig  # Page admin
└── var/
    ├── data.db         # Base SQLite
    └── tmp/           # Upload temporaire
```

## 🎨 Design

- **Tailwind CSS 4** : Framework CSS utility-first
- **DaisyUI** : Composants UI pré-stylés
- **Responsive** : Mobile-first design
- **Thèmes** : Light/Dark support

## 🔐 Permissions

```bash
# Donner les permissions aux dossiers
chmod -R 777 var/
chmod -R 777 public/uploads/
```

## 📱 Installation PWA

1. Ouvrir l'application dans un navigateur
2. Cliquer sur "Installer l'app"
3. L'icône apparaît sur l'écran d'accueil

## 🐛 Dépannage

### Erreur upload_tmp_dir
Le fichier `php.ini` local est configuré pour utiliser `var/tmp/`

### Assets non compilés
```bash
pnpm run dev
```

### Base de données manquante
```bash
php bin/console doctrine:database:create
php bin/console doctrine:migrations:migrate
```

## 📝 License

Propriétaire
