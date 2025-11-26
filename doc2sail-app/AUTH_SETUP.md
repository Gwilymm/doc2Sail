# Doc2Sail Mobile App - Authentication

## Configuration

1. Copiez `.env.example` vers `.env`:
```bash
cp .env.example .env
```

2. Modifiez `.env` avec l'URL de votre API Symfony:
```
EXPO_PUBLIC_API_URL=http://YOUR_IP:8000
```

**Important**: Pour le développement mobile (iOS/Android), n'utilisez pas `localhost`. Utilisez l'adresse IP de votre machine sur le réseau local (ex: `192.168.1.10:8000`).

## Routes disponibles

- `/` - Page d'accueil (affiche l'état de connexion)
- `/sign-in` - Page de connexion

## Utilisation du contexte d'authentification

```tsx
import { useAuth } from '@/lib/auth-context';

function MyComponent() {
  const { user, isLoading, signIn, signOut } = useAuth();
  
  // user: Utilisateur connecté ou null
  // isLoading: Chargement en cours
  // signIn: Fonction pour se connecter
  // signOut: Fonction pour se déconnecter
}
```

## API Symfony requise

L'app s'attend à ce que votre API Symfony expose les endpoints suivants:

### POST `/api/login`
```json
// Request
{
  "email": "user@example.com",
  "password": "password"
}

// Response
{
  "token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh_token": "def50200...",
  "expires_in": 3600
}
```

### POST `/api/token/refresh`
```json
// Request
{
  "refresh_token": "def50200..."
}

// Response
{
  "token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh_token": "def50200...",
  "expires_in": 3600
}
```

### GET `/api/me`
```
// Headers
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc...

// Response
{
  "id": 1,
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe"
}
```

## Stockage sécurisé

Les tokens sont stockés de manière sécurisée avec `expo-secure-store`:
- Sur iOS: Keychain
- Sur Android: EncryptedSharedPreferences
- Sur Web: LocalStorage (moins sécurisé)
