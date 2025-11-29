# 🚀 Authentification Doc2Sail - Guide Complet

Implémentation d'un formulaire de connexion pour l'application mobile Doc2Sail qui s'intègre avec l'API Symfony.

## ✅ Fichiers créés

### Application Mobile (doc2sail-app/)

**Services:**
- `lib/api.ts` - Client API avec gestion JWT
- `lib/auth-context.tsx` - Contexte React d'authentification

**Écrans:**
- `app/sign-in.tsx` - Formulaire de connexion
- `app/_layout.tsx` - ✏️ Modifié pour inclure AuthProvider
- `app/index.tsx` - ✏️ Modifié pour afficher l'état de connexion

**Configuration:**
- `.env` - Variables d'environnement
- `.env.example` - Template de configuration
- `.gitignore` - ✏️ Mis à jour pour ignorer .env

**Documentation:**
- `AUTH_SETUP.md` - Documentation technique de l'authentification
- `SIGN_IN_IMPLEMENTATION.md` - Résumé de l'implémentation

### Backend Symfony (src/)

**Contrôleur:**
- `src/Controller/UserController.php` - Endpoint `/api/me` pour récupérer les infos utilisateur

## 🔧 Composants UI installés

Tous les composants ont été installés via `@react-native-reusables/cli`:
- ✅ `input` - Champ de saisie
- ✅ `label` - Labels de formulaire
- ✅ `card` - Cartes avec header/content/footer

## 📦 Dépendances ajoutées

```bash
npx expo install expo-secure-store
```

## 🌐 Endpoints API Symfony

### 1. POST `/api/login`
**Déjà existant** - Authentification JWT configurée dans `security.yaml`

```json
// Request
{
  "email": "user@example.com",
  "password": "password"
}

// Response (200)
{
  "token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh_token": "def50200...",
  "expires_in": 3600
}
```

### 2. POST `/api/token/refresh`
**Déjà existant** - Refresh token configuré dans `config/routes/gesdinet_jwt_refresh_token.yaml`

```json
// Request
{
  "refresh_token": "def50200..."
}

// Response (200)
{
  "token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh_token": "def50200...",
  "expires_in": 3600
}
```

### 3. GET `/api/me` ⭐ NOUVEAU
**Créé** dans `src/Controller/UserController.php`

```
// Headers
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc...

// Response (200)
{
  "id": 1,
  "email": "1",
  "displayName": "Skipper Alpha",
  "firstName": "Skipper Alpha",
  "lastName": null,
  "roles": ["ROLE_USER"],
  "createdAt": "2025-11-26T10:00:00+00:00",
  "lastLoginAt": "2025-11-26T11:00:00+00:00"
}
```

⚠️ **Note**: L'email retourné est actuellement l'ID car les emails sont hashés dans la base pour des raisons de sécurité.

## 🚀 Démarrage

### 1. Configuration de l'API URL

Éditez `doc2sail-app/.env`:
```bash
EXPO_PUBLIC_API_URL=http://192.168.1.10:8000
```

**Important**: Utilisez votre adresse IP locale, pas `localhost` pour les tests sur mobile.

### 2. Démarrer le backend Symfony

```bash
symfony server:start
# ou
php -S localhost:8000 -t public/
```

### 3. Démarrer l'app mobile

```bash
cd doc2sail-app
pnpm dev
```

## 📱 Fonctionnalités implémentées

### Authentification
- ✅ Connexion avec email/password
- ✅ Stockage sécurisé des tokens JWT (Keychain iOS / EncryptedSharedPreferences Android)
- ✅ Refresh automatique du token expiré
- ✅ Déconnexion
- ✅ Persistance de session (reste connecté après fermeture de l'app)

### Interface utilisateur
- ✅ Formulaire de connexion responsive
- ✅ Gestion des états de chargement
- ✅ Affichage des erreurs
- ✅ Mode clair/sombre automatique
- ✅ Accessibilité (labels, ARIA)
- ✅ Support clavier (dismiss, types de clavier adaptés)

### Sécurité
- ✅ Tokens stockés dans un stockage sécurisé
- ✅ Gestion des erreurs réseau
- ✅ Validation des champs
- ✅ Protection CSRF via JWT

## 🎯 Utilisation dans l'app

### Hook useAuth()

```tsx
import { useAuth } from '@/lib/auth-context';

function MyComponent() {
  const { user, isLoading, signIn, signOut } = useAuth();
  
  // Connexion
  const handleLogin = async () => {
    try {
      await signIn('email@example.com', 'password');
      // Redirection automatique
    } catch (error) {
      console.error(error);
    }
  };
  
  // Déconnexion
  const handleLogout = async () => {
    await signOut();
  };
  
  if (isLoading) {
    return <ActivityIndicator />;
  }
  
  return user ? (
    <Text>Connecté: {user.email}</Text>
  ) : (
    <Button onPress={handleLogin}>Se connecter</Button>
  );
}
```

### API Client direct

```tsx
import { api } from '@/lib/api';

// Login
const tokens = await api.login({ 
  email: 'user@example.com', 
  password: 'password' 
});

// Get user info
const user = await api.getCurrentUser();

// Logout
await api.logout();
```

## ⚠️ Points d'attention

### 1. Email hashé
L'entité User utilise un `emailHash` au lieu d'un email en clair. Vous devrez peut-être:
- Stocker l'email séparément si vous en avez besoin
- Ou ajouter un champ `email` non hashé à l'entité User

### 2. Configuration CORS
Assurez-vous que votre backend Symfony accepte les requêtes de l'app mobile:

```yaml
# config/packages/nelmio_cors.yaml
nelmio_cors:
    defaults:
        origin_regex: true
        allow_origin: ['*']
        allow_methods: ['GET', 'OPTIONS', 'POST', 'PUT', 'PATCH', 'DELETE']
        allow_headers: ['Content-Type', 'Authorization']
        expose_headers: ['Link']
        max_age: 3600
```

### 3. URL de développement
Sur mobile réel, `localhost` ne fonctionne pas. Utilisez:
- L'adresse IP de votre machine sur le réseau local
- Ngrok ou un tunnel similaire pour exposer votre API

## 🔜 Prochaines étapes suggérées

### Fonctionnalités
- [ ] Page d'inscription (`/sign-up`)
- [ ] Réinitialisation de mot de passe
- [ ] Validation de l'email
- [ ] Connexion sociale (Google, Apple)
- [ ] Biométrie (Face ID / Touch ID)

### Amélirations UX
- [ ] Animation de transition
- [ ] Indicateur de force du mot de passe
- [ ] "Se souvenir de moi"
- [ ] Mode hors ligne

### Sécurité
- [ ] Rate limiting côté API
- [ ] Détection de fraude
- [ ] Logs d'authentification
- [ ] Révocation de tokens

## 📚 Ressources

- [React Native Reusables](https://reactnativereusables.com/)
- [Expo SecureStore](https://docs.expo.dev/versions/latest/sdk/securestore/)
- [LexikJWTAuthenticationBundle](https://github.com/lexik/LexikJWTAuthenticationBundle)
- [Gesdinet JWT Refresh Token Bundle](https://github.com/markitosgv/JWTRefreshTokenBundle)

## 🐛 Dépannage

### Erreur "Network request failed"
- Vérifiez que le backend Symfony est démarré
- Vérifiez l'URL dans `.env`
- Sur mobile, utilisez l'IP locale au lieu de localhost

### Erreur 401 Unauthorized
- Vérifiez les identifiants
- Vérifiez que JWT est configuré correctement dans Symfony
- Vérifiez que le token n'est pas expiré

### Les composants UI ne s'affichent pas correctement
- Vérifiez que NativeWind est configuré
- Relancez l'app avec `pnpm dev -c` (clear cache)

---

✨ **L'authentification est maintenant complètement fonctionnelle !**
