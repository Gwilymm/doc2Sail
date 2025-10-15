# 🚀 Optimisations et Améliorations Doc2Sail

## ✅ Optimisations Déjà Implémentées

### Backend (PHP/Symfony)
- ✅ Service Worker pour offline-first
- ✅ Cache des assets statiques
- ✅ Compression Gzip activée
- ✅ Lazy loading des images
- ✅ WebPush avec gestion des subscriptions expirées
- ✅ Logging structuré avec Monolog
- ✅ Transactions Doctrine optimisées
- ✅ Validation côté serveur

### Frontend
- ✅ Stimulus pour JavaScript minimal et performant
- ✅ Webpack Encore pour bundling optimisé
- ✅ DaisyUI pour composants légers
- ✅ Service Worker avec stratégies de cache
- ✅ PWA installable
- ✅ Responsive design

### Infrastructure
- ✅ Docker pour isolation et déployabilité
- ✅ FrankenPHP pour performances PHP
- ✅ Mercure pour notifications temps réel
- ✅ SQLite pour simplicité (production: MySQL recommandé)

---

## 🔧 Optimisations Recommandées

### 1. Base de Données

**Passer à MySQL/PostgreSQL en production**

```yaml
# docker-compose.prod.yml
services:
  db:
    image: mysql:8.0
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_ROOT_PASSWORD}
      MYSQL_DATABASE: doc2sail
      MYSQL_USER: ${DB_USER}
      MYSQL_PASSWORD: ${DB_PASSWORD}
    volumes:
      - db-data:/var/lib/mysql
    networks:
      - doc2sail-network

volumes:
  db-data:
```

**Indexer les colonnes fréquemment requêtées**

```php
// src/Entity/Regatta.php
#[ORM\Index(columns: ['access_token'], name: 'idx_access_token')]
class Regatta { ... }

// src/Entity/Document.php
#[ORM\Index(columns: ['regatta_id', 'category'], name: 'idx_regatta_category')]
class Document { ... }

// src/Entity/PushSubscription.php
#[ORM\Index(columns: ['regatta_token'], name: 'idx_regatta_token')]
#[ORM\Index(columns: ['last_used_at'], name: 'idx_last_used')]
class PushSubscription { ... }
```

### 2. Cache Redis pour Performance

**Ajouter Redis pour cache et sessions**

```yaml
# docker-compose.prod.yml
services:
  redis:
    image: redis:7-alpine
    restart: unless-stopped
    volumes:
      - redis-data:/data
    networks:
      - doc2sail-network

volumes:
  redis-data:
```

```yaml
# config/packages/cache.yaml
framework:
    cache:
        app: cache.adapter.redis
        default_redis_provider: redis://redis:6379
```

### 3. Optimisations Assets

**Activer le versioning et la compression**

```javascript
// webpack.config.js
Encore
    .enableVersioning(Encore.isProduction())
    .configureBabel((config) => {
        config.plugins.push('@babel/plugin-proposal-class-properties');
    })
    .configureBabelPresetEnv((config) => {
        config.useBuiltIns = 'usage';
        config.corejs = 3;
    })
;
```

**Minifier les images**

```bash
# Installer imagemin
pnpm add -D imagemin imagemin-mozjpeg imagemin-pngquant imagemin-svgo

# Créer un script d'optimisation
node scripts/optimize-images.js
```

### 4. Sécurité Renforcée

**Content Security Policy (CSP)**

```php
// src/EventListener/SecurityHeadersListener.php
namespace App\EventListener;

use Symfony\Component\EventDispatcher\Attribute\AsEventListener;
use Symfony\Component\HttpKernel\Event\ResponseEvent;

#[AsEventListener(event: 'kernel.response')]
class SecurityHeadersListener
{
    public function onKernelResponse(ResponseEvent $event): void
    {
        $response = $event->getResponse();
        
        $response->headers->set('X-Frame-Options', 'SAMEORIGIN');
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('X-XSS-Protection', '1; mode=block');
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->headers->set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
        
        // CSP pour PWA et Web Push
        $csp = "default-src 'self'; " .
               "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " .
               "style-src 'self' 'unsafe-inline'; " .
               "img-src 'self' data: https:; " .
               "font-src 'self' data:; " .
               "connect-src 'self' https://doc2sail.platypus-home.noho.st wss://doc2sail.platypus-home.noho.st https://fcm.googleapis.com; " .
               "manifest-src 'self';";
        
        $response->headers->set('Content-Security-Policy', $csp);
    }
}
```

**Rate Limiting**

```yaml
# config/packages/rate_limiter.yaml
framework:
    rate_limiter:
        api_upload:
            policy: 'sliding_window'
            limit: 10
            interval: '1 hour'
        
        api_auth:
            policy: 'fixed_window'
            limit: 5
            interval: '15 minutes'
```

```php
// Dans DocumentController::upload()
use Symfony\Component\RateLimiter\RateLimiterFactory;

#[Route('/regatta/{id}/upload', name: 'app_document_upload', methods: ['POST'])]
public function upload(
    Regatta $regatta,
    Request $request,
    RateLimiterFactory $apiUploadLimiter
): JsonResponse {
    $limiter = $apiUploadLimiter->create($request->getClientIp());
    
    if (!$limiter->consume(1)->isAccepted()) {
        return new JsonResponse(['error' => 'Trop de requêtes'], 429);
    }
    
    // ... rest of the code
}
```

### 5. Nettoyage Automatique

**Créer une commande pour nettoyer les anciennes subscriptions**

```php
// src/Command/CleanupPushSubscriptionsCommand.php
namespace App\Command;

use App\Repository\PushSubscriptionRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(
    name: 'app:cleanup:push-subscriptions',
    description: 'Remove inactive push subscriptions older than 90 days'
)]
class CleanupPushSubscriptionsCommand extends Command
{
    public function __construct(
        private PushSubscriptionRepository $repository,
        private EntityManagerInterface $entityManager
    ) {
        parent::__construct();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        
        $count = $this->repository->removeInactive();
        
        $io->success(sprintf('Removed %d inactive push subscriptions', $count));
        
        return Command::SUCCESS;
    }
}
```

**Ajouter au crontab**

```bash
# Crontab (nettoyer chaque semaine)
0 3 * * 0 docker-compose -f /var/www/doc2sail/docker-compose.prod.yml exec -T app php bin/console app:cleanup:push-subscriptions
```

### 6. Monitoring et Alertes

**Installer Symfony Profiler pour développement**

```yaml
# config/packages/dev/web_profiler.yaml
framework:
    profiler:
        only_exceptions: false
        collect_serializer_data: true
```

**Logger les erreurs critiques**

```yaml
# config/packages/prod/monolog.yaml
monolog:
    handlers:
        main:
            type: fingers_crossed
            action_level: error
            handler: grouped
        
        grouped:
            type: group
            members: [streamed, deduplicated]
        
        streamed:
            type: stream
            path: "%kernel.logs_dir%/%kernel.environment%.log"
            level: debug
        
        deduplicated:
            type: deduplication
            handler: swift
        
        swift:
            type: swift_mailer
            from_email: 'alerts@doc2sail.platypus-home.noho.st'
            to_email: 'admin@doc2sail.platypus-home.noho.st'
            subject: 'Doc2Sail Error Alert'
            level: critical
```

### 7. Optimisations Service Worker

**Améliorer la stratégie de cache**

```javascript
// public/sw-public.js

// Stratégie Network First pour les documents (toujours la dernière version)
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    
    // Documents : Network First
    if (url.pathname.includes('/uploads/documents/')) {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    const responseClone = response.clone();
                    caches.open(DOCUMENTS_CACHE).then(cache => {
                        cache.put(event.request, responseClone);
                    });
                    return response;
                })
                .catch(() => caches.match(event.request))
        );
        return;
    }
    
    // Assets statiques : Cache First
    if (url.pathname.includes('/build/')) {
        event.respondWith(
            caches.match(event.request)
                .then(response => response || fetch(event.request))
        );
        return;
    }
    
    // Pages : Network First avec timeout
    event.respondWith(
        Promise.race([
            fetch(event.request),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('timeout')), 3000)
            )
        ])
        .catch(() => caches.match(event.request))
    );
});
```

### 8. Tests Automatisés

**Ajouter des tests unitaires et fonctionnels**

```bash
# Installer PHPUnit
composer require --dev symfony/test-pack

# Créer des tests
php bin/console make:test
```

```php
// tests/Service/WebPushServiceTest.php
namespace App\Tests\Service;

use App\Service\WebPushService;
use Symfony\Bundle\FrameworkBundle\Test\KernelTestCase;

class WebPushServiceTest extends KernelTestCase
{
    public function testSendNotification(): void
    {
        self::bootKernel();
        
        $service = static::getContainer()->get(WebPushService::class);
        
        // Test sending notification
        $count = $service->sendNotification('test-token', 'Test', 'Message');
        
        $this->assertIsInt($count);
    }
}
```

### 9. Documentation API

**Ajouter NelmioApiDocBundle**

```bash
composer require nelmio/api-doc-bundle
```

```yaml
# config/packages/nelmio_api_doc.yaml
nelmio_api_doc:
    documentation:
        info:
            title: Doc2Sail API
            description: API for Doc2Sail PWA
            version: 1.0.0
    areas:
        path_patterns:
            - ^/api(?!/doc$)
```

### 10. Progressive Enhancement

**Améliorer l'expérience offline**

```javascript
// assets/controllers/offline_controller.js

// Ajouter un indicateur de connexion
connect() {
    this.updateConnectionStatus();
    
    window.addEventListener('online', () => this.updateConnectionStatus());
    window.addEventListener('offline', () => this.updateConnectionStatus());
}

updateConnectionStatus() {
    const status = navigator.onLine ? 'online' : 'offline';
    document.body.dataset.connectionStatus = status;
    
    if (!navigator.onLine) {
        this.showOfflineNotification();
    }
}

showOfflineNotification() {
    const banner = document.createElement('div');
    banner.className = 'alert alert-warning fixed top-0 left-0 right-0 z-50';
    banner.innerHTML = `
        <svg>...</svg>
        <span>Vous êtes hors ligne. Les modifications seront synchronisées quand la connexion sera rétablie.</span>
    `;
    document.body.prepend(banner);
}
```

---

## 📊 Métriques de Performance Recommandées

### Lighthouse Scores Objectifs
- **Performance**: > 90
- **Accessibility**: > 95
- **Best Practices**: > 95
- **SEO**: > 90
- **PWA**: > 90

### Core Web Vitals
- **LCP (Largest Contentful Paint)**: < 2.5s
- **FID (First Input Delay)**: < 100ms
- **CLS (Cumulative Layout Shift)**: < 0.1

---

## 🎯 Checklist Avant Production

- [ ] Variables d'environnement de production configurées
- [ ] Certificats SSL installés et valides
- [ ] Base de données migrée et indexée
- [ ] Cache Redis configuré (optionnel)
- [ ] Logs configurés et monitored
- [ ] Sauvegardes automatiques en place
- [ ] Rate limiting activé
- [ ] Headers de sécurité configurés
- [ ] Tests automatisés passent
- [ ] Service Worker testé en production
- [ ] Notifications Push testées
- [ ] Performance Lighthouse > 90
- [ ] Documentation à jour

---

**🎉 Avec ces optimisations, Doc2Sail sera ultra-performant et sécurisé en production !**
