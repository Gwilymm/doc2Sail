# CLAUDE.md

Instructions pour Claude Code dans ce dépôt.

## Vue d'ensemble

**Doc2Sail** est une Progressive Web App (PWA) de gestion et partage de documents pour les régates de voile. Elle propose une interface admin authentifiée et une vue publique accessible par token.

**Stack :**
- Backend : Symfony 7.4, API Platform 4, Doctrine ORM, SQLite
- Frontend : Stimulus.js, Tailwind CSS 4, DaisyUI, Hotwired Turbo
- Build : Webpack Encore, **pnpm** (jamais npm ni yarn)
- Temps-réel : Mercure Hub (SSE), Web Push (VAPID)
- Auth : Magic Link passwordless + JWT (pour l'API mobile)
- Déploiement : Docker avec FrankenPHP

---

## Commandes essentielles

```bash
# Installation
composer install
pnpm install

# Base de données
php bin/console doctrine:database:create
php bin/console doctrine:migrations:migrate

# Assets
pnpm run build          # Production
pnpm run dev            # Dev
pnpm run watch          # Watch mode

# Serveur de développement
symfony server:start    # Port 8000 (recommandé)

# Docker
docker compose -f compose.yaml up --build
# app:8000, mailpit:8025, mercure:3000

# Tests
./bin/phpunit

# Maintenance
php bin/console cache:clear
chmod -R 777 var/ public/uploads/

# Migrations (après modification d'entité)
php bin/console make:migration
php bin/console doctrine:migrations:migrate
```

---

## Architecture backend

### Entités (`src/Entity/`)

| Entité | Rôle |
|--------|------|
| `User` | Email haché ARGON2ID dans `$emailHash` — **jamais d'email en clair** |
| `Regatta` | Entité centrale : owner + coOwners + accessToken public |
| `Document` | Métadonnées fichier lié à une régate, catégories prédéfinies |
| `MagicLink` | Token pour authentification passwordless |
| `RegattaInvitation` | Invitations co-propriétaires par email |
| `PushSubscription` | Abonnements Web Push |
| `RefreshToken` | Stockage refresh JWT (gesdinet) |

**Catégories de documents :**
```php
Document::AVAILABLE_CATEGORIES = ['AC', 'IC', 'Modifications', 'Gestion de course', 'Jury', 'Résultats']
Document::DEFAULT_CATEGORY = 'Autre'
```

### API Layer (`src/Api/`, `src/State/`)

- Resources API Platform définies par attribut `#[ApiResource]` sur les entités
- Providers custom dans `src/State/` (ex. `RegattaDocumentsProvider` pour `/regattas/{id}/documents`)
- Processors custom dans `src/State/` (ex. `RegattaProcessor` assigne le owner à la création)
- Controllers API dans `src/Api/` : `MeController`, `DocumentDownloadController`, `NotificationController`

### Controllers web (`src/Controller/`)

- `AuthController` / `ApiAuthController` : magic link web et API
- `RegattaController` : CRUD régates + invitation co-propriétaires + vue publique `/r/{token}`
- `DocumentController` : upload/téléchargement/suppression de documents
- `DocumentViewerController` : visionneuse PDF intégrée
- `PushController` : gestion abonnements Web Push
- `QRCodeController` : génération QR code de partage
- `ManifestController` : manifest PWA dynamique

### Services (`src/Service/`)

- `DocumentUploader` : upload vers `public/uploads/documents/{regattaId}/`, suppression fichier et répertoire
- `WebPushService` : envoi notifications Web Push
- `RegattaNotificationService` : logique métier notifications régates via Mercure

### Sécurité (`src/Security/`)

- `LoginLinkAuthenticator` : authentification magic link web
- `UserProvider` : provider custom (identifiant = `$id`, non email)
- `RegattaVoter` : `REGATTA_VIEW` / `REGATTA_EDIT` / `REGATTA_DELETE`
  - EDIT → owner ou co-owner (`canManage()`)
  - DELETE → owner uniquement

---

## Architecture frontend

### Stimulus Controllers (`assets/controllers/`)

| Fichier | Rôle |
|---------|------|
| `auth_controller.js` | UI d'authentification |
| `document_controller.js` | Upload et gestion documents |
| `regatta_controller.js` | CRUD régates côté client |
| `regatta_public_controller.js` | Vue publique régate |
| `pdf_viewer_controller.js` | Visionneuse PDF (PDF.js) |
| `notification_controller.js` | Notifications temps-réel Mercure |
| `push_subscription_controller.js` | Abonnement Web Push |
| `offline_controller.js` | Détection hors-ligne PWA |
| `service-worker_controller.js` | Enregistrement service worker |
| `qrcode_share_controller.js` | Partage QR code |
| `theme_controller.js` | Thème clair/sombre |
| `ui_controller.js` | Interactions UI générales |
| `fab_controller.js` | Bouton flottant (FAB) |
| `filters_controller.js` | Filtres de liste |

### PWA (`public/`)

- `sw.js` : service worker utilisateurs authentifiés
- `sw-public.js` : service worker pages publiques
- `manifest.json` / `manifest-public.json` : manifests PWA

---

## Règle critique : stockage email

Les emails ne sont **jamais stockés en clair**. Seul le hash ARGON2ID est en base.

```php
// CORRECT : recherche par email
$user = $userRepository->findByEmail('user@example.com');
// Utilise password_verify() en interne sur tous les utilisateurs

// INCORRECT : requête directe sur emailHash
// findOneBy(['emailHash' => $hash]) ne fonctionnera pas
```

Pour créer un utilisateur :
```php
$user->setEmail('user@example.com'); // hashage automatique ARGON2ID
```

---

## Flux d'authentification

### Web (magic link)
1. `POST /login` → génère `MagicLink` → envoie email
2. Clic sur le lien → `LoginLinkAuthenticator` → session + cookie remember_me (24h)

### API / Mobile (JWT)
1. `POST /api/auth/request` → envoie magic link
2. `POST /api/auth/verify` avec token → retourne JWT + refresh token
3. Header : `Authorization: Bearer <token>`
4. Refresh : `POST /api/token/refresh`

### Dev uniquement
- `POST /api/auth/dev/magic` : magic link sans email (tests E2E, dev mobile)

---

## Upload de fichiers

Toujours passer par le service `DocumentUploader` :

```php
// Upload
$result = $documentUploader->upload($uploadedFile, $regattaId);
// Retourne ['filename', 'mimeType', 'size']

// Suppression fichier
$documentUploader->delete($filename, $regattaId);

// Suppression répertoire régate entier
$documentUploader->deleteRegattaDirectory($regattaId);
```

Chemin de stockage : `public/uploads/documents/{regattaId}/{filename}`

---

## Ajouter une ressource API

1. Créer l'entité dans `src/Entity/` avec `#[ApiResource]`
2. Configurer les opérations avec security (voters)
3. Si logique collection custom → provider dans `src/State/`
4. Si logique create/update custom → processor dans `src/State/`
5. Si contrôle d'accès fin → voter dans `src/Security/Voter/`

```php
#[ApiResource(
    operations: [
        new GetCollection(provider: MyProvider::class),
        new Post(processor: MyProcessor::class, security: "is_granted('ROLE_USER')")
    ]
)]
class MyEntity {}
```

---

## Notifications

**Mercure (SSE) :**
```php
$regattaNotificationService->notifyRegattaUpdate($regatta, 'document_added');
```

**Web Push :**
```php
$webPushService->sendNotification($user, 'Titre', 'Corps', ['data' => 'val']);
```

---

## Variables d'environnement clés

```bash
DATABASE_URL="sqlite:///%kernel.project_dir%/var/data.db"
MAILER_DSN=smtp://localhost:1025
MAILER_FROM=noreply@doc2sail.local
JWT_SECRET_KEY=%kernel.project_dir%/config/jwt/private.pem
JWT_PUBLIC_KEY=%kernel.project_dir%/config/jwt/public.pem
JWT_PASSPHRASE=...
MERCURE_URL=http://localhost:3000/.well-known/mercure
MERCURE_PUBLIC_URL=http://localhost:3000/.well-known/mercure
MERCURE_JWT_SECRET=...
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
CORS_ALLOW_ORIGIN=...    # Regex, ex: pour app mobile Expo
```

---

## Règles importantes

- **Package manager : pnpm uniquement** — ne pas utiliser npm ou yarn
- **Migrations** : toujours créer une migration pour tout changement de schéma
- **Assets** : lancer `pnpm run build` avant de committer des changements frontend
- **Cache** : `php bin/console cache:clear` en cas de comportement inattendu
- **Permissions** : `chmod -R 777 var/ public/uploads/` si erreurs de droits
- **Secrets** : ne jamais committer `.env.local`, clés JWT (`config/jwt/`), secrets de prod
- **CORS mobile** : mettre à jour `CORS_ALLOW_ORIGIN` pour les apps Expo (voir `Docs/CORS_EXPO_GUIDE.md`)

## Documentation interne

- `Docs/AUTHENTICATION_GUIDE.md` : détail du flux d'authentification
- `Docs/CORS_EXPO_GUIDE.md` : configuration CORS pour app mobile Expo
- `Docs/SECURITY_AUDIT_REPORT.md` : audit sécurité
- API Swagger : http://localhost:8000/api/docs
