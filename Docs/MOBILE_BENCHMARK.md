# Benchmark stratégie mobile native — Doc2Sail

> Analyse réalisée mai 2026 · Stack actuelle : Symfony 8 + API Platform + PWA + Hotwire Native Android (partiel)

## Contexte

Doc2Sail est une PWA Symfony 8 avec un shell Android Kotlin Hotwire Native existant et un placeholder iOS vide. Le ressenti visuel WebView n'est pas satisfaisant pour un usage production. Objectif : **stores + UI réellement native + APIs système** sur iOS, Android ET web, par un dev solo full-stack TypeScript/React.

**Existant conservé dans tous les cas :**
- Backend Symfony + API Platform (tous les endpoints `/api/*`)
- Authentification magic link + JWT
- Push VAPID, Mercure SSE
- PWA web accessible via navigateur

---

## Les 4 options comparées

### Option A — Hotwire Native (statu quo amélioré)

Shell natif Swift/Kotlin qui charge les pages Symfony dans une WKWebView/WebView. Bridges Stimulus ↔ natif pour les composants clés.

| Critère | Note | Détail |
|---------|------|--------|
| UI native | ⚠️ Partielle | Navigation native possible, contenu reste HTML/CSS |
| APIs système | ⚠️ Limitée | Bridges Swift/Kotlin manuels pour chaque API |
| Effort | ✅ Faible | Shell Android existe, iOS = copier le pattern |
| Compétences requises | ⚠️ | Swift + Kotlin pour les bridges |
| Code partagé | ✅ Maximal | 100% du frontend web réutilisé |
| Feel natif | ❌ Faible | WebView visible (scroll, fonts, latence) |
| Stores | ✅ | Déjà démontré Android |

**Verdict :** Chemin de moindre résistance mais plafond bas. Le problème WebView n'est pas résolu fondamentalement.

---

### Option B — Capacitor

Capacitor compile une SPA web dans un bundle natif iOS/Android avec accès aux APIs natives via plugins JS.

| Critère | Note | Détail |
|---------|------|--------|
| UI native | ❌ Faible | Toujours WebView |
| APIs système | ✅ Bonne | Plugins pour caméra, fichiers, push, biométrie |
| Effort | ⚠️ Moyen | Symfony ≠ SPA → réécriture frontend nécessaire |
| Compétences requises | ✅ | JavaScript pur, zéro Swift/Kotlin |
| Code partagé | ⚠️ | 2 frontends à maintenir |
| Feel natif | ❌ Faible | Même problème WebView |
| Stores | ✅ | Oui |

**Verdict :** Résout l'accès aux APIs natives mais pas le ressenti visuel. Nécessite quand même de réécrire le frontend.

---

### Option C — Expo (React Native) ✅ RETENU

Application React Native cross-platform (iOS + Android + Web via Expo Router). Backend Symfony inchangé, frontend mobile réécrit en React Native.

| Critère | Note | Détail |
|---------|------|--------|
| UI native | ✅ Excellent | Vrais composants natifs iOS/Android, zéro WebView |
| APIs système | ✅ Excellent | Expo SDK : push FCM/APNs, caméra, fichiers, biométrie, deep links |
| Effort | ⚠️ Élevé | Réécriture frontend mobile (~6 semaines à 2h/jour) |
| Compétences requises | ✅ | TypeScript + React = zone de confort |
| Code partagé | ✅ | API Platform réutilisée à 100% |
| Feel natif | ✅ Excellent | Composants OS réels, animations fluides |
| Stores | ✅ | EAS Build → App Store + Play Store |
| Web | ✅ | Expo Router supporte le web ou garder la PWA Symfony |

**Architecture cible :**
```
doc2Sail/
├── backend/    ← Symfony (inchangé)
├── mobile/     ← Expo app (iOS + Android + optionnellement Web)
└── web/        ← PWA Symfony (conservée pour navigateur)
```

---

### Option D — Flutter

| Critère | Note | Détail |
|---------|------|--------|
| UI native | ✅ Excellent | Rendu propre, style Flutter reconnaissable |
| APIs système | ✅ Bonne | Plugins pub.dev |
| Effort | ❌ Très élevé | Dart = nouveau langage |
| Compétences requises | ❌ | Hors zone de confort solo web dev |
| Web | ⚠️ | Flutter Web non recommandé pour une app web |

**Verdict :** Excellent techniquement mais incompatible avec un profil solo web dev. Écarté.

---

## Tableau décisionnel

| | Hotwire Native | Capacitor | **Expo ✅** | Flutter |
|---|:---:|:---:|:---:|:---:|
| UI réellement native | ⚠️ | ❌ | ✅ | ✅ |
| APIs système complètes | ⚠️ | ✅ | ✅ | ✅ |
| Profil solo web/TS/React | ⚠️ | ✅ | ✅ | ❌ |
| Réutilisation backend | ✅ | ⚠️ | ✅ | ✅ |
| **Score global** | 3/5 | 3/5 | **5/5** | 3/5 |

---

## Pourquoi Expo gagne

1. **TypeScript/React** → zéro apprentissage de langage
2. **Vrais composants natifs** → résout exactement le problème visuel
3. **Expo SDK** → push FCM/APNs, `expo-document-picker`, `expo-file-system`, `expo-camera`, biométrie, deep links — tout en JS
4. **EAS Build** → CI/CD cloud, génère `.ipa` et `.apk` sans Mac nécessaire pour Android
5. **Expo Router** → navigation fichier-based (comme Next.js), même code pour web + mobile
6. **L'API Platform reste intacte** → zéro touche au backend

## Points d'attention Symfony → Expo

- **Push notifications :** L'endpoint `/api/push/subscribe` attend du VAPID web. Créer `/api/push/subscribe-native` pour les tokens Expo (FCM/APNs).
- **Magic link deep link :** Configurer un scheme `doc2sail://` dans `app.json` pour catcher le token depuis l'email.
- **CORS :** Ajouter l'IP dev Expo à `CORS_ALLOW_ORIGIN` (ex. `http://192.168.x.x:8081`).
