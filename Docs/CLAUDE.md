# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Doc2Sail is a Progressive Web App (PWA) for managing and sharing sailing regatta documents. It features passwordless authentication via magic links, document management, real-time notifications, and a dual-interface design (public view and admin panel).

**Tech Stack:**
- Backend: Symfony 7.3, API Platform 4, Doctrine ORM, SQLite
- Frontend: Stimulus controllers, Tailwind CSS 4, DaisyUI, Hotwired Turbo
- Build: Webpack Encore, pnpm package manager
- Real-time: Mercure Hub, Web Push notifications
- Authentication: JWT + Magic Link (passwordless)
- Deployment: Docker with FrankenPHP, Docker Compose

## Key Commands

### Development Setup
```bash
# Install dependencies
composer install
pnpm install

# Database setup
php bin/console doctrine:database:create
php bin/console doctrine:migrations:migrate

# Build assets
pnpm run build           # Production build
pnpm run dev             # Development build
pnpm run watch           # Watch mode for development
pnpm run dev-server      # Webpack dev server with HMR
```

### Running the Application
```bash
# Local development
symfony server:start     # Recommended (runs on port 8000)
php -S localhost:8000 -t public/

# Docker
docker compose -f compose.yaml up --build
# Services: app (8000), mailpit (8025 UI, 1025 SMTP), mercure (3000)
```

### Testing
```bash
./bin/phpunit            # Run all tests
php bin/phpunit          # Alternative command

# For test environment, ensure:
export APP_ENV=test
```

### Maintenance
```bash
php bin/console cache:clear              # Clear cache
chmod -R 777 var/                        # Fix permissions
chmod -R 777 public/uploads/
```

## Architecture

### Backend Structure

**Entities (`src/Entity/`):**
- `User`: Stores hashed emails (ARGON2ID) in `emailHash` field - never store plaintext emails
- `Regatta`: Main domain object with owner/coOwners relationships
- `Document`: File metadata linked to regattas
- `MagicLink`: Passwordless authentication tokens
- `RegattaInvitation`: Invitation system for regatta collaborators
- `PushSubscription`: Web push notification subscriptions
- `RefreshToken`: JWT refresh token storage

**API Layer (`src/Api/` and `src/State/`):**
- API Platform resources use `#[ApiResource]` attributes on entities
- Custom providers in `src/State/`: `RegattaDocumentsProvider`
- Custom processors in `src/State/`: `RegattaProcessor`
- API controllers in `src/Api/`: `MeController`, `DocumentDownloadController`, `NotificationController`, `OpenApiDecorator`

**Controllers (`src/Controller/`):**
- `ApiAuthController`: Magic link generation and JWT token issuance for API
- `AuthController`: Web-based magic link authentication
- `DocumentController`: Document upload/view/delete
- `RegattaController`: Regatta management UI
- `PushController`: Web Push subscription management
- `QRCodeController`: QR code generation for sharing
- `DevTokenController`: Dev-only token generation endpoint
- `ManifestController`: Dynamic PWA manifest generation

**Services (`src/Service/`):**
- `DocumentUploader`: Handles file uploads to `public/uploads/documents/`
- `WebPushService`: Web Push notification delivery
- `RegattaNotificationService`: Business logic for regatta notifications

**Security (`src/Security/`):**
- `LoginLinkAuthenticator`: Web magic link authentication
- `LoginFormAuthenticator`: Fallback form authentication
- `UserProvider`: Custom user provider for security layer
- Voters in `src/Security/Voter/`: Fine-grained authorization (e.g., `RegattaVoter` checks owner/coOwners)

**Repositories (`src/Repository/`):**
- `UserRepository::findByEmail()`: Uses `verifyEmail()` method with `password_verify()` to match hashed emails

### Frontend Structure

**Assets (`assets/`):**
- `app.js`: Main entry point
- `bootstrap.js`: Stimulus initialization
- `controllers.json`: Stimulus controller configuration
- `styles/`: Tailwind CSS and custom styles

**Stimulus Controllers (`assets/controllers/`):**
- `auth_controller.js`: Authentication UI logic
- `document_controller.js`: Document management interactions
- `regatta_controller.js`: Regatta UI interactions
- `notification_controller.js`: Real-time notification handling
- `push_subscription_controller.js`: Web Push subscription management
- `offline_controller.js`: PWA offline detection
- `qrcode_share_controller.js`: QR code sharing functionality
- `ui_controller.js`: General UI interactions
- `csrf_protection_controller.js`: CSRF token handling
- `fab_controller.js`: Floating action button
- `contact_form_controller.js`: Contact form handling
- `pricing_toggle_controller.js`: Pricing UI toggles

**PWA Files (`public/`):**
- `manifest.json`: PWA manifest (user-specific)
- `manifest-public.json`: Public PWA manifest
- `sw.js`: Service worker for authenticated users
- `sw-public.js`: Service worker for public pages
- `icon.png`, `icon-192.png`, `icon-512.png`: PWA icons

### Configuration

**Security (`config/packages/security.yaml`):**
- Three firewalls: `dev`, `api` (JWT with refresh tokens), `main` (magic link)
- JWT authentication via `lexik/jwt-authentication-bundle`
- Remember me: 24-hour lifetime with `always_remember_me: true`
- Public access patterns: `/api/login`, `/api/token/refresh`, `/api/auth/*`, `/api/docs`
- API Platform GET on `/api/regattas` is public; other API routes require `ROLE_USER`

**API Platform (`config/packages/api_platform.yaml`):**
- Stateless API with JSONLD and JSON formats
- Cache headers: Vary on Content-Type, Authorization, Origin
- Swagger/OpenAPI docs at `/api/docs`

**CORS (`config/packages/nelmio_cors.yaml`):**
- Controlled via `CORS_ALLOW_ORIGIN` environment variable
- Multiple origins supported (comma-separated)
- Required for mobile app integration (see CORS_EXPO_GUIDE.md)

**Mercure (`config/packages/mercure.yaml`):**
- Real-time updates hub at `MERCURE_URL`
- Requires `MERCURE_JWT_SECRET` for publishing
- Docker service runs on port 3000

## Privacy-First User Storage

**CRITICAL:** Users store emails as ARGON2ID hashes in `User::$emailHash`. Never store or assume plaintext emails.

```php
// CORRECT: Finding users by email
$user = $userRepository->findByEmail('user@example.com');

// INCORRECT: Querying emailHash directly
// $user = $userRepository->findOneBy(['emailHash' => $hash]); // Won't work
```

The `UserRepository::findByEmail()` method iterates through users and uses `password_verify()` to match the hash.

## Authentication Flow

### Web Authentication (Magic Link)
1. User enters email at `/login`
2. System generates a magic link token (`MagicLink` entity)
3. Email sent with magic link URL
4. User clicks link, authenticated via `LoginLinkAuthenticator`
5. Session established with remember_me cookie (24h)

### API Authentication (JWT)
1. User requests magic link at `POST /api/auth/request`
2. Magic link sent to email
3. User verifies link at `POST /api/auth/verify` with token
4. API returns JWT access token + refresh token
5. Client stores tokens and includes JWT in `Authorization: Bearer <token>` header
6. Refresh tokens via `POST /api/token/refresh`

### Dev-Only Shortcut
- `POST /api/auth/dev/magic`: Generates magic link without email (dev environment only)
- Useful for mobile development and E2E tests

## File Upload Pattern

Always use `DocumentUploader` service for file operations:

```php
// Upload
$document = $documentUploader->upload($uploadedFile, $regatta);

// Delete
$documentUploader->delete($document);
```

Files stored in `public/uploads/documents/`. File paths accessed via `Document::getFilePath()`.

## Adding New API Resources

1. Create entity in `src/Entity/` with `#[ApiResource]` attribute
2. Configure operations (GET, POST, PUT, PATCH, DELETE)
3. Add custom provider in `src/State/` if needed for custom collection logic
4. Add custom processor in `src/State/` if needed for create/update/delete logic
5. Create voter in `src/Security/Voter/` for authorization if needed
6. Register services in `config/services.yaml` if explicit wiring required (autowiring is enabled by default)

Example pattern:
```php
#[ApiResource(
    operations: [
        new GetCollection(provider: MyCustomProvider::class),
        new Post(processor: MyCustomProcessor::class, security: "is_granted('ROLE_USER')")
    ]
)]
class MyEntity { }
```

## Notification System

**Mercure (Server-Sent Events):**
- Topics published to Mercure Hub via `RegattaNotificationService`
- Frontend subscribes to topics in Stimulus controllers
- Requires `MERCURE_URL` and `MERCURE_JWT_SECRET` environment variables

**Web Push (Push API):**
- Managed via `WebPushService`
- Subscriptions stored in `PushSubscription` entity
- Requires `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` environment variables
- Frontend subscribes via `push_subscription_controller.js`

## Testing Patterns

Tests use PHPUnit and often include mocks for external services:

```php
// Example from ApiAuthControllerTest.php
$mailer = $this->createMock(MailerInterface::class);
$jwtManager = $this->createMock(JWTTokenManagerInterface::class);
$rateLimiter = $this->createMock(RateLimiterFactory::class);
```

Test database: Export `APP_ENV=test` and run migrations for test database.

## Docker Development

`compose.yaml` defines three services:

1. **app**: FrankenPHP with Symfony app (port 8000)
   - Mounts project directory to `/app`
   - SQLite database at `var/data.db`

2. **mailer**: Mailpit for email testing
   - SMTP on port 1025
   - Web UI at http://localhost:8025

3. **mercure**: Mercure Hub for real-time updates
   - HTTP on port 3000
   - Anonymous subscriptions enabled
   - CORS configured for localhost origins

## Environment Variables

Key variables (see `.env` and `.env.local`):

```bash
# Core
APP_ENV=dev
APP_SECRET=changeme
DATABASE_URL="sqlite:///%kernel.project_dir%/var/data.db"

# Email
MAILER_DSN=smtp://localhost:1025
MAILER_FROM=noreply@doc2sail.local

# JWT
JWT_SECRET_KEY=%kernel.project_dir%/config/jwt/private.pem
JWT_PUBLIC_KEY=%kernel.project_dir%/config/jwt/public.pem
JWT_PASSPHRASE=your_passphrase

# Mercure
MERCURE_URL=http://localhost:3000/.well-known/mercure
MERCURE_PUBLIC_URL=http://localhost:3000/.well-known/mercure
MERCURE_JWT_SECRET=!ChangeThisMercureHubJWTSecretKey!

# Web Push
VAPID_PUBLIC_KEY=your_public_key
VAPID_PRIVATE_KEY=your_private_key

# CORS (for mobile apps)
CORS_ALLOW_ORIGIN=http://localhost:8000,exp://192.168.1.100:8081
```

## Common Patterns

### Checking Regatta Access
Use security voters instead of manual checks:
```php
$this->denyAccessUnlessGranted('edit', $regatta);
```

### Querying Documents
Use repositories with custom methods:
```php
$documents = $documentRepository->findByRegatta($regatta);
```

### Publishing Mercure Updates
```php
$regattaNotificationService->notifyRegattaUpdate($regatta, 'document_added');
```

### Sending Web Push
```php
$webPushService->sendNotification($user, 'Title', 'Body', ['data' => 'value']);
```

## Important Notes

- **Never commit secrets:** JWT keys in `config/jwt/`, production secrets in `.env.local`
- **File permissions:** Ensure `var/` and `public/uploads/` are writable (777 in dev)
- **Package manager:** This project uses pnpm, not npm or yarn
- **Migrations:** Always create migrations for schema changes: `php bin/console make:migration`
- **Assets:** Run `pnpm run build` before committing if you modify frontend code
- **Cache issues:** Run `php bin/console cache:clear` if encountering weird behavior
- **CORS for mobile:** Update `CORS_ALLOW_ORIGIN` to include mobile app origins (see CORS_EXPO_GUIDE.md)

## Documentation References

- `AUTHENTICATION_GUIDE.md`: Detailed authentication implementation
- `CORS_EXPO_GUIDE.md`: Mobile app CORS configuration
- `.github/copilot-instructions.md`: Additional development guidance
- API docs: http://localhost:8000/api/docs (when running)
