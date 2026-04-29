# AGENTS.md

Instructions pour les agents IA autonomes travaillant sur ce dépôt.

---

## Contexte projet

**Doc2Sail** — PWA Symfony 7.4 / API Platform 4 pour la gestion de documents de régates de voile.

- Base de données : SQLite (`var/data.db`)
- Package manager JS : **pnpm** (ne jamais utiliser npm ou yarn)
- Conteneurisation : Docker Compose (FrankenPHP + Mailpit + Mercure)
- Tests : PHPUnit (`./bin/phpunit`)

---

## Ce qu'un agent peut faire librement

- Lire n'importe quel fichier du dépôt
- Lancer `php bin/console cache:clear`
- Lancer `./bin/phpunit` pour valider les tests
- Lancer `pnpm run build` ou `pnpm run dev` pour vérifier la compilation des assets
- Lancer `php bin/console doctrine:schema:validate` pour valider le schéma
- Créer des migrations : `php bin/console make:migration`
- Appliquer des migrations sur l'environnement de dev

## Ce qu'un agent doit éviter sans confirmation explicite

- Modifier les clés JWT (`config/jwt/`)
- Modifier `.env` ou `.env.local`
- Pousser des commits sur `master`
- Supprimer des fichiers uploadés dans `public/uploads/`
- Modifier `config/packages/security.yaml` (impact direct sur l'auth)
- Exécuter des commandes Docker sur un environnement de production

---

## Règle absolue : stockage des emails

Les emails des utilisateurs ne sont **jamais stockés en clair** dans la base de données. Le champ `User::$emailHash` contient un hash ARGON2ID.

```php
// Créer/modifier un utilisateur
$user->setEmail('user@example.com'); // hashage automatique

// Trouver un utilisateur par email
$user = $userRepository->findByEmail('user@example.com'); // utilise password_verify()

// Vérifier l'email d'un utilisateur
$user->verifyEmail('user@example.com'); // retourne bool
```

Ne jamais requêter directement `emailHash`, ne jamais stocker un email en clair.

---

## Sécurité

**Voters pour l'autorisation :**
- `REGATTA_EDIT` → owner ou co-owner (`Regatta::canManage()`)
- `REGATTA_DELETE` → owner uniquement

Toujours utiliser les voters, jamais de vérifications manuelles d'ownership :
```php
$this->denyAccessUnlessGranted('REGATTA_EDIT', $regatta);
```

**Firewalls (security.yaml) :**
- `api` (stateless JWT) : toutes les routes `/api/*`
- `main` (session) : routes web `/regatta/*`
- Routes publiques : `/api/auth/*`, `/api/docs`, `/r/{token}` (vue publique régate)

---

## Conventions de code

### Entités
- Annotations Doctrine en attributs PHP 8 (`#[ORM\...]`)
- Groupes de sérialisation sur chaque propriété (`#[Groups([...])]`)
- Validations Symfony Validator (`#[Assert\...]`)

### Controllers
- Étendre `AbstractController` de Symfony
- Injection de dépendances via constructeur
- Retourner `JsonResponse` pour les endpoints AJAX, `Response`/`render()` pour les pages Twig

### API Platform
- Opérations déclarées dans `#[ApiResource]` sur l'entité
- Logique collection custom → `src/State/*Provider.php`
- Logique mutation custom → `src/State/*Processor.php`
- Sécurité fine → `src/Security/Voter/`

### Frontend
- Interactions JS via Stimulus controllers dans `assets/controllers/`
- Navigation sans rechargement via Hotwired Turbo
- CSS : Tailwind CSS 4 + DaisyUI — ne pas écrire de CSS custom si une classe utilitaire suffit

---

## Workflow de développement

### Ajouter une fonctionnalité backend

1. Modifier ou créer l'entité dans `src/Entity/`
2. Générer la migration : `php bin/console make:migration`
3. Appliquer : `php bin/console doctrine:migrations:migrate`
4. Ajouter le controller ou l'opération API Platform
5. Ajouter le voter si nouvelle règle d'autorisation
6. Écrire/mettre à jour les tests dans `tests/`
7. Valider : `./bin/phpunit`

### Ajouter un Stimulus controller

1. Créer `assets/controllers/{nom}_controller.js`
2. L'enregistrement est automatique via `assets/controllers.json` ou Stimulus auto-discovery
3. Utiliser `data-controller="{nom}"` dans le template Twig
4. Reconstruire : `pnpm run build`

### Modifier le schéma de base de données

```bash
# Après modification d'une entité
php bin/console make:migration
php bin/console doctrine:migrations:migrate

# Vérifier la cohérence
php bin/console doctrine:schema:validate
```

---

## Upload de fichiers

Passer systématiquement par `DocumentUploader` (jamais de manipulation de fichiers directe) :

```php
// Upload → retourne ['filename', 'mimeType', 'size']
$result = $documentUploader->upload($uploadedFile, $regattaId);

// Suppression d'un fichier
$documentUploader->delete($filename, $regattaId);

// Suppression de tout le répertoire d'une régate
$documentUploader->deleteRegattaDirectory($regattaId);
```

Stockage : `public/uploads/documents/{regattaId}/{filename-uuid.ext}`

---

## Tests

```bash
# Lancer tous les tests
./bin/phpunit

# Environnement de test (base de données séparée)
APP_ENV=test php bin/console doctrine:database:create --if-not-exists
APP_ENV=test php bin/console doctrine:migrations:migrate
APP_ENV=test ./bin/phpunit
```

Les tests existants se trouvent dans :
- `tests/Api/ApiAuthControllerTest.php` — tests du flow d'authentification API
- `tests/Controller/ContactControllerTest.php` — tests du formulaire de contact

Utiliser des mocks pour `MailerInterface`, `JWTTokenManagerInterface` et `RateLimiterFactory`.

---

## Catégories de documents

L'ordre des catégories est significatif pour l'affichage :

```php
// Sections dans l'interface
"Documents de course" → ['AC', 'IC', 'Modifications']
"Autres documents"    → ['Gestion de course', 'Jury', 'Résultats']
```

Respecter ces catégories pour tout ajout de document.

---

## Vue publique

Les régates sont accessibles publiquement via `/r/{accessToken}`. Le token est généré automatiquement à la création (`bin2hex(random_bytes(32))`). Cette route ne nécessite **aucune authentification**.

---

## Notifications temps-réel

**Mercure (SSE) :**
```php
$regattaNotificationService->notifyRegattaUpdate($regatta, 'document_added');
```

**Web Push :**
```php
$webPushService->sendNotification($user, 'Titre', 'Corps', ['url' => '/r/token']);
```

Les deux systèmes nécessitent les variables d'environnement `MERCURE_JWT_SECRET`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`.

---

## Points d'attention

- Le `getUserIdentifier()` de `User` retourne `$id` (entier), pas l'email
- `UserRepository::findByEmail()` itère sur tous les users et utilise `password_verify()` — ne pas l'appeler dans des boucles sur de grands volumes
- Les documents supprimés via `EntityManager::remove()` déclenchent la suppression en cascade (ORM), mais les fichiers physiques doivent être supprimés manuellement via `DocumentUploader::delete()`
- Les régates supprimées déclenchent `DocumentUploader::deleteRegattaDirectory()` dans `RegattaController::delete()`
