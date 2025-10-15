# 📱 Système de Téléchargement Hors Ligne - PWA Public

## 🎯 Vue d'ensemble

Le système de téléchargement hors ligne permet aux utilisateurs de consulter une régate et ses documents même sans connexion internet.

## 🏗️ Architecture

### Fichiers créés

1. **`public/sw-public.js`** - Service Worker dédié à la partie publique
   - Gère le cache des documents
   - Stratégie Cache First pour documents
   - Communication avec la page via postMessage

2. **`assets/controllers/offline_controller.js`** - Controller Stimulus
   - Enregistre le Service Worker
   - Déclenche le téléchargement des documents
   - Affiche la progression
   - Gère le statut du cache

3. **`public/manifest-public.json`** - Manifest PWA pour partie publique
   - Scope: `/public/` (isolé de la partie admin)
   - Peut être installé séparément

### Fichiers modifiés

- **`templates/regatta/public.html.twig`**
  - Ajout du controller offline
  - Banner de téléchargement
  - Modal de progression
  - Statut "déjà en cache"

- **`src/Controller/RegattaController.php`**
  - Préparation des données `documentsForOffline`
  - Inclut ID, nom, filePath, catégorie

## 🔄 Flux de fonctionnement

### 1. Première visite (avec réseau)

```
Utilisateur → Page publique
    ↓
Service Worker s'enregistre (scope: /public/)
    ↓
Controller vérifie le cache
    ↓
Pas de cache → Affiche banner "Télécharger pour hors ligne"
```

### 2. Clic sur "Télécharger maintenant"

```
Controller → Message au SW: "CACHE_DOCUMENTS"
    ↓
SW télécharge tous les documents (batch de 5)
    ↓
SW envoie progression: "5/15 documents"
    ↓
Modal affiche la progression
    ↓
Fin → Modal se ferme
    ↓
Banner devient "✅ Disponible hors ligne"
```

### 3. Visite suivante (sans réseau)

```
Utilisateur → Page publique
    ↓
SW intercepte les requêtes
    ↓
Documents servis depuis le cache
    ↓
Navigation hors ligne complète ✅
```

## 📦 Ce qui est mis en cache

### Cache Statique
- CSS/JS de l'application
- Assets de build
- Images/icônes

### Cache Documents
- Tous les PDFs
- Tous les fichiers uploadés
- Métadonnées de la régate

### Métadonnées
```json
{
  "regattaToken": "abc123",
  "documents": [...],
  "cachedAt": "2025-10-15T14:30:00Z",
  "version": "doc2sail-public-v1"
}
```

## 🎮 Commandes disponibles

### Depuis la page (via controller)

```javascript
// Télécharger tous les documents
downloadForOffline()

// Vérifier le statut du cache
checkCacheStatus()

// Vider le cache
clearCache()
```

### Messages Service Worker

```javascript
// Vers le SW
{
  type: 'CACHE_DOCUMENTS',
  documents: [...],
  regattaToken: 'abc123'
}

// Depuis le SW
{
  type: 'CACHE_PROGRESS',
  current: 5,
  total: 15
}

{
  type: 'CACHE_COMPLETE',
  success: true
}
```

## 🧪 Testing

### Test en local

1. **Activer le Service Worker en HTTP** (déjà fait dans base.html.twig)

2. **Visiter une page publique**
   ```
   http://localhost:8000/public/{token}
   ```

3. **Ouvrir DevTools**
   - Application → Service Workers
   - Vérifier que `sw-public.js` est actif
   - Scope: `/public/`

4. **Cliquer sur "Télécharger maintenant"**
   - Voir la modal de progression
   - Console: logs du téléchargement

5. **Vérifier le cache**
   - Application → Cache Storage
   - Voir `doc2sail-public-v1-documents`
   - Tous les documents sont là

6. **Simuler le mode hors ligne**
   - DevTools → Network → Offline
   - Rafraîchir la page
   - Navigation fonctionne ✅

### Test sur mobile

1. **Déployer sur HTTPS** (obligatoire pour PWA)

2. **Visiter la page publique**

3. **Cliquer sur "Télécharger maintenant"**

4. **Couper le WiFi/4G**

5. **Recharger la page** → Fonctionne hors ligne ✅

## 📊 Taille estimée

Pour une régate typique avec 15 documents:
- 10 PDFs (2MB chacun) = 20MB
- 5 images (500KB chacune) = 2.5MB
- Assets CSS/JS = 500KB
- **Total: ~23MB**

Chrome permet jusqu'à 60% de l'espace disque disponible.

## 🚀 Prochaines améliorations possibles

1. **Compression côté serveur**
   - Servir des PDFs optimisés
   - Compresser les images

2. **Téléchargement sélectif**
   - Checkbox par document
   - "Télécharger seulement les documents de course"

3. **Synchronisation auto**
   - Background Sync API
   - Mise à jour automatique quand réseau revient

4. **Notifications**
   - "3 nouveaux documents disponibles"
   - "Synchronisation terminée"

5. **Stockage persistant**
   - `navigator.storage.persist()`
   - Éviter suppression automatique du cache

6. **Statistiques**
   - Afficher la taille totale avant téléchargement
   - "Espace utilisé: 23MB"

## 🐛 Debugging

### Service Worker ne s'enregistre pas
```javascript
// Console Browser
navigator.serviceWorker.getRegistrations()
  .then(regs => console.log(regs))
```

### Cache vide
```javascript
// Console Browser
caches.keys()
  .then(keys => console.log(keys))

caches.open('doc2sail-public-v1-documents')
  .then(cache => cache.keys())
  .then(keys => console.log(keys))
```

### Forcer la mise à jour du SW
```javascript
// Console Browser
navigator.serviceWorker.getRegistrations()
  .then(regs => regs.forEach(reg => reg.update()))
```

### Vider tous les caches
```javascript
// Console Browser
caches.keys()
  .then(keys => Promise.all(keys.map(k => caches.delete(k))))
```

## 📖 Ressources

- [Service Worker API](https://developer.mozilla.org/fr/docs/Web/API/Service_Worker_API)
- [Cache Storage API](https://developer.mozilla.org/fr/docs/Web/API/Cache)
- [PWA Manifest](https://web.dev/add-manifest/)
- [Background Sync](https://web.dev/periodic-background-sync/)
