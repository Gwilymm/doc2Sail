# Doc2Sail Mobile — Roadmap Expo
## Planning 2h/jour · 6 semaines · ~60h

**Stack :** Expo (React Native) + Expo Router + TypeScript  
**Backend :** Symfony + API Platform — inchangé  
**Objectif :** App iOS + Android dans les stores, UI réellement native

---

## Semaine 1 — Fondations & Auth (10h) ✅

| Jour | Durée | Statut | Tâche | Fichiers cibles |
|------|-------|--------|-------|-----------------|
| J1 | 2h | ✅ | Init Expo + Expo Router + TypeScript, structure dossiers, config EAS | `mobile/app/`, `eas.json` |
| J2 | 2h | ✅ | Service auth : `POST /api/auth/request` + `/api/auth/login`, stockage JWT avec `expo-secure-store` | `mobile/services/auth.ts` |
| J3 | 2h | ✅ | Écran Login (saisie email + confirmation magic link) | `mobile/app/(auth)/login.tsx` |
| J4 | 2h | ✅ | Refresh token automatique, guards de navigation (redirect si non auth) | `mobile/hooks/useAuth.ts` |
| J5 | 2h | ✅ | Structure navigation : tabs (Régates / Profil) + stack modals | `mobile/app/(tabs)/`, `mobile/app/_layout.tsx` |

**Livrable :** Login fonctionnel, navigation skeleton, appels API réels

---

## Semaine 2 — Écrans Régates & Documents (10h) ✅

| Jour | Durée | Statut | Tâche | Fichiers cibles |
|------|-------|--------|-------|-----------------|
| J6 | 2h | ✅ | Liste des régates (`GET /api/regattas`), composant `RegattaCard` | `mobile/app/(tabs)/regattas/index.tsx` |
| J7 | 2h | ✅ | Détail régate (`GET /api/regattas/{id}`), header avec dates | `mobile/app/(tabs)/regattas/[id].tsx` |
| J8 | 2h | ✅ | Liste documents par régate (`GET /api/regattas/{id}/documents`), badges catégories | `mobile/components/DocumentRow.tsx` |
| J9 | 2h | ✅ | Filtres catégories, recherche locale, états vide/erreur/loading | `mobile/components/FilterBottomSheet.tsx` |
| J10 | 2h | ✅ | Pull-to-refresh, pagination (`hydra:next`), skeleton loading | `mobile/hooks/useRegattas.ts` |

**Bonus réalisé :** Dark/light theme complet (M3 tokens) sur toutes les pages et composants — `mobile/context/ThemeContext.tsx`, `mobile/components/navigation/CustomTabBar.tsx`

**Livrable :** Navigation complète, lecture des données réelles

---

## Semaine 3 — Upload & Vue Publique (10h)

| Jour | Durée | Statut | Tâche | Fichiers cibles |
|------|-------|--------|-------|-----------------|
| J11 | 2h | ✅ | Upload document avec `expo-document-picker` → `POST /api/documents` | `mobile/app/regattas/[id]/upload.tsx`, `mobile/services/documents.ts`, `src/Api/DocumentUploadController.php` |
| J12 | 2h | ✅ | Progress bar upload intégrée, gestion erreurs taille/MIME, retry après refresh JWT | `mobile/app/regattas/[id]/upload.tsx`, `mobile/services/documents.ts` |
| J13 | 2h | ⬜ | Vue publique `/r/{token}` sans auth (deep link + écran dédié) | `mobile/app/public/[token].tsx` |
| J14 | 2h | ⬜ | Visionneuse PDF (`expo-web-browser` ou `react-native-pdf`) | `mobile/components/PdfViewer.tsx` |
| J15 | 2h | ⬜ | QR code share : affichage (`react-native-qrcode-svg`) + partage natif (`expo-sharing`) | `mobile/components/QRShare.tsx` |

**Réalisé :** endpoint API multipart `POST /api/documents`, contrôle `REGATTA_EDIT`, upload via `DocumentUploader`, sélection fichier native, catégories, description, progress bar et refresh du détail au retour du modal.

**Livrable restant :** accès public, PDF consultable, QR code share

---

## Semaine 4 — Notifications & Offline (10h)

| Jour | Durée | Statut | Tâche | Fichiers cibles |
|------|-------|--------|-------|-----------------|
| J16 | 2h | ⬜ | `expo-notifications` : permissions iOS + Android, token FCM/APNs | `mobile/services/notifications.ts` |
| J17 | 2h | ⬜ | Enregistrement subscription → endpoint Symfony adapté pour tokens Expo | `mobile/hooks/usePushNotifications.ts` |
| J18 | 2h | ⬜ | Mercure SSE temps-réel via `react-native-sse` | `mobile/services/mercure.ts` |
| J19 | 2h | ⬜ | Cache offline avec `expo-file-system`, indicateur hors-ligne | `mobile/hooks/useOfflineCache.ts` |
| J20 | 2h | ⬜ | Téléchargement PDF offline, liste des docs disponibles hors-ligne | `mobile/app/offline.tsx` |

**Livrable :** Notifications push natives, consultation offline

---

## Semaine 5 — Polish & Tests (10h)

| Jour | Durée | Statut | Tâche | Fichiers cibles |
|------|-------|--------|-------|-----------------|
| J21 | 2h | ✅ | Thème dark/light (avancé en S2), palette M3 cohérente | `mobile/context/ThemeContext.tsx` |
| J22 | 2h | ⬜ | Animations Expo Router, feedback tactile `expo-haptics` | `mobile/components/` |
| J23 | 2h | ⬜ | Création régate (`POST /api/regattas`), invitations co-owners | `mobile/app/regattas/new.tsx` |
| J24 | 2h | ⬜ | Tests sur device réel iOS + Android, fix notch / edge-to-edge Android | — |
| J25 | 2h | ⬜ | Deep links : magic link email → ouvre l'app, gestion session expirée | `mobile/app/_layout.tsx` |

**Livrable :** App complète, testée sur devices réels

---

## Semaine 6 — Distribution Stores (10h)

| Jour | Durée | Statut | Tâche | Fichiers cibles |
|------|-------|--------|-------|-----------------|
| J26 | 2h | ⬜ | Config EAS Build (dev/preview/production), `app.json` final (icônes, splash, scheme) | `eas.json`, `app.json` |
| J27 | 2h | ⬜ | Build Android (`eas build --platform android`), signing keystore | — |
| J28 | 2h | ⬜ | Build iOS (`eas build --platform ios`), certificats Apple Developer | — |
| J29 | 2h | ⬜ | Métadonnées stores : screenshots, descriptions FR/EN | — |
| J30 | 2h | ⬜ | Soumission Play Store (beta interne) + App Store (TestFlight) | — |

**Livrable :** App en review sur les deux stores

---

## Architecture Expo cible

```
mobile/
├── app/
│   ├── _layout.tsx              ← Root layout + auth guard + deep links
│   ├── (auth)/
│   │   └── login.tsx
│   ├── (tabs)/
│   │   ├── _layout.tsx
│   │   ├── regattas/
│   │   │   ├── _layout.tsx
│   │   │   ├── index.tsx        ← Liste régates
│   │   │   └── [id].tsx         ← Détail régate
│   │   └── profile.tsx
│   ├── regattas/
│   │   ├── [id]/upload.tsx      ← Upload document ✅
│   │   └── new.tsx              ← Créer régate
│   ├── public/
│   │   └── [token].tsx          ← Vue publique /r/{token}
│   └── offline.tsx              ← Docs disponibles offline
├── components/
│   ├── DocumentRow.tsx          ✅
│   ├── RegattaCard.tsx          ✅
│   ├── FilterBottomSheet.tsx    ✅
│   ├── SkeletonCard.tsx         ✅
│   ├── navigation/
│   │   └── CustomTabBar.tsx     ✅ (FAB flottant, speed dial contextuel)
│   ├── PdfViewer.tsx
│   └── QRShare.tsx
├── context/
│   ├── AuthContext.tsx          ✅
│   └── ThemeContext.tsx         ✅ (M3, dark/light)
├── services/
│   ├── api.ts                   ✅
│   ├── auth.ts                  ✅
│   ├── documents.ts             ✅ (upload multipart, progress, validation MIME/taille)
│   ├── notifications.ts
│   └── mercure.ts
├── hooks/
│   ├── useAuth.ts               ✅
│   ├── useRegattas.ts           ✅ (pagination hydra:next)
│   ├── useRegattaDetail.ts      ✅
│   ├── usePushNotifications.ts
│   └── useOfflineCache.ts
└── constants/
    └── Colors.ts
```

---

## Points d'attention Symfony à traiter en cours de route

### Semaine 4 — Notifications natives
L'endpoint actuel `POST /api/push/subscribe` attend un format VAPID web (`endpoint`, `keys.p256dh`, `keys.auth`). Pour Expo, créer :
```
POST /api/push/subscribe-native  { expoToken: "ExponentPushToken[...]" }
```
Ou adapter l'entité `PushSubscription` pour accepter les deux formats.

### Semaine 1 — Deep links magic link
Dans `app.json` :
```json
{
  "expo": {
    "scheme": "doc2sail",
    "intentFilters": [{ "action": "VIEW", "data": [{ "scheme": "https", "host": "doc2sail.fr", "pathPrefix": "/api/auth/verify" }] }]
  }
}
```

### CORS dev
Ajouter dans `.env.local` :
```
CORS_ALLOW_ORIGIN='^https?://(localhost|192\.168\.[0-9]+\.[0-9]+)(:[0-9]+)?$'
```
