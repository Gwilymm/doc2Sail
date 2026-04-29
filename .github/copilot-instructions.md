# Doc2Sail — Copilot Instructions (brief & actionable)

This file is a short, practical guide to help Copilot / AI coding agents be immediately productive in this repository. Keep the advice specific to this codebase and avoid generic rules.

## Big picture

-   Backend: Symfony 7 (API platform, Doctrine ORM). Look in `src/` for controllers, entities, services, repositories and security.
-   Frontend: Stimulus controllers + Tailwind/DaisyUI built via Webpack Encore. Frontend code in `assets/`, server build output in `public/build/`.
-   Persistence: SQLite by default (`var/data.db`), Doctrine migrations in `migrations/`.
-   API: ApiPlatform is used for core resources (`src/Entity/*` annotated with `#[ApiResource]`). Custom providers/processors live in `src/State/`.
-   Authentication: Magic Link (passwordless) + JWT for API; magic link endpoints are in `src/Controller/ApiAuthController.php` and web login is in `src/Controller/AuthController.php`.
-   Real-time: Mercure Hub + Web Push for notifications (`src/Service/RegattaNotificationService.php`, `src/Service/WebPushService.php`).
-   File storage: Uploaded files are stored in `public/uploads/documents` and managed via `App\Service\DocumentUploader`.

## Key places to look

-   Domain models: `src/Entity/` (Document, Regatta, User, MagicLink, etc.)
-   API logic: `src/Api/*` and `src/State/*` (providers/processors)
-   Web controllers (UI): `src/Controller/*` (DocumentController, ApiAuthController, AuthController)
-   Business logic: `src/Service/*` (DocumentUploader, WebPushService, RegattaNotificationService)
-   Security: `src/Security/*` and `config/packages/security.yaml` (LoginLinkAuthenticator, voters in `src/Security/Voter`).
-   JS frontend: `assets/` and `assets/controllers/*` (Stimulus controllers).
-   PWA: `public/sw.js`, `public/manifest.json` and service worker handling.
-   CORS / mobile docs: `CORS_EXPO_GUIDE.md` for mobile client integration details.

## How to run locally (developer workflow)

-   Install PHP deps / Node deps
    -   PHP: `composer install`
    -   JS: `pnpm install` (pnpm is used in this repo)
-   Database (local):
    -   `php bin/console doctrine:database:create`
    -   `php bin/console doctrine:migrations:migrate`
-   Build assets: `pnpm run build`; dev watch: `pnpm run watch` or `pnpm run dev-server`.
-   Run the app:
    -   Local (Symfony CLI): `symfony server:start` (public at `http://localhost:8000`)
    -   Or Docker: `docker compose -f compose.yaml up --build` (exposes `app` on port 8000 and mailpit on 1025/8025)
-   Tests: use `./bin/phpunit` or `php bin/phpunit` (there is a `bin/phpunit` wrapper). For test DB, export `APP_ENV=test` and check fixtures or `README` hints.

## Notable conventions & patterns (repo-specific)

-   Privacy-first user storage: `User::setEmail()` stores a hashed email (ARGON2ID) in `emailHash`. To find users by email, use `UserRepository::findByEmail` which calls `verifyEmail()` (password_verify). Don’t store or assume plaintext email anywhere.
-   Magic link + JWT hybrid: Web site uses Symfony LoginLink (LoginLinkAuthenticator) and the API uses lexik/jwt-authentication bundle. See `src/Controller/ApiAuthController.php` and `config/packages/security.yaml`.
-   File uploads: Use `App\Service\DocumentUploader` to handle file moving and deletion; do not manipulate `public/uploads` paths manually. Document file path access: `Document::getFilePath()`.
-   ApiPlatform customization: Some resource collections use custom providers (e.g., `RegattaDocumentsProvider`) and processors (e.g., `RegattaProcessor`). When adding an API route that needs custom behavior, follow the `ApiResource` attributes pattern.
-   Voters: Fine-grained authorization is implemented using voters (e.g., `RegattaVoter`), which check `owner` and `coOwners`. Add voter checks for any new domain object needing access control.
-   Dev/test helper endpoints: `POST /api/auth/dev/magic` creates a dev magic link (only usable in `dev` environment) — good for mobile dev & E2E tests without email.
-   Notifications: Mercure and Web Push are configured; ensure `MERCURE_*` and `VAPID_*` environment variables exist for local testing (see `.env` and `compose.yaml`).
-   CORS: CORS whitelist is controlled via `CORS_ALLOW_ORIGIN` env var and `config/packages/nelmio_cors.yaml`.
-   Email dev testing: `compose.yaml` includes `mailpit` (UI at `http://localhost:8025`) for dev email inspection.

## Patterns for adding or editing code (examples)

-   Add a new entity + API resource
    -   Add entity in `src/Entity`, annotate with `#[ApiResource(...)]` and configure `operations` (GET, POST, custom providers/processors as needed).
    -   Implement logic in `src/State/*` if you need custom pagination/creation behavior.
    -   Register services in `config/services.yaml` if explicit wiring is required (otherwise autowiring is on).
-   To add a new file upload flow
    -   Wire the uploader via `DocumentUploader` or create a new service reusing its patterns; register directory via `parameters: documents_directory` in `config/services.yaml`.
-   Add API-only endpoints
    -   Prefer `src/Api` with routes decorated `#[Route('/api/...')]` for consistency. Add DTOs in `src/Dto` if needed.
-   Security & ACL
    -   Add or update voters in `src/Security/Voter` and adjust `config/packages/security.yaml` rules. For admin pages, check `src/Controller/Admin*` patterns.

## Debugging & tests

-   Logs & cache: `var/log/*` and `var/cache/*` — run `php bin/console cache:clear` for cache issues.
-   Run tests: `./bin/phpunit`.
-   Use Mailpit UI (`http://localhost:8025`) to see emails generated by magic link flows.
-   Important: tests often rely on mocks (e.g., `ApiAuthControllerTest.php`) — follow the pattern of creating mocks for `Mailer`, `JWTManager`, `RateLimiterFactory`.

## Safety & environment

-   Secrets live in `.env` / `.env.local` and JWT private/public keys in `config/jwt` — do NOT commit production secrets.
-   CI/production: Make sure `APP_ENV=prod`, proper `DATABASE_URL`, `JWT_*` keys, and `MERCURE_JWT_SECRET` are configured.

## Quick list of useful file paths for agents

-   Entities and API: `src/Entity/*`, `src/Api/*`, `src/State/*`
-   Controllers (web + API): `src/Controller/*` (AuthController, ApiAuthController, DocumentController, MeController)
-   Services: `src/Service/*` (DocumentUploader, WebPushService, RegattaNotificationService)
-   Security: `src/Security/*`, `src/Security/Voter/*` and `config/packages/security.yaml`
-   Frontend: `assets/` and `assets/controllers/` (Stimulus), `public/sw.js`
-   Build / run: `README.md`, `compose.yaml`, `package.json`, `Dockerfile`

---

If anything above is unclear or you'd like me to include different details (e.g., sample API request + response bodies, or a short how-to for adding a new feature like push notifications), tell me what to add and I will iterate.
