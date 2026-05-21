# Configuration CORS pour Application Expo (React Native)

## 📱 Vue d'ensemble

Ce guide explique comment configurer CORS pour permettre à votre future application mobile Expo de communiquer avec l'API Doc2Sail de manière sécurisée.

---

## 🔧 Configuration Backend (Symfony)

### 1. Variables d'environnement

Créez/modifiez votre fichier `.env.local` :

```bash
# Production
CORS_ALLOW_ORIGIN='^https://(app\.)?doc2sail\.com$'

# Développement local
# CORS_ALLOW_ORIGIN='^https?://(localhost|127\.0\.0\.1|192\.168\.1\.100)(:[0-9]+)?$'
```

**⚠️ IMPORTANT** :
- **NE JAMAIS** utiliser `*` (wildcard) en production
- La configuration Symfony actuelle utilise `origin_regex: true` : `CORS_ALLOW_ORIGIN` doit donc être une regex unique, pas une liste séparée par des virgules
- Inclure le protocole exact (`https://`, `http://`, `exp://`)

---

### 2. Origines Expo selon l'environnement

| Environnement                | Origine à autoriser        | Exemple                     |
| ---------------------------- | -------------------------- | --------------------------- |
| **Expo Go (dev)**            | `exp://[IP_LOCAL]:[PORT]`  | `exp://192.168.1.100:8081`  |
| **Expo Dev Client**          | `http://[IP_LOCAL]:[PORT]` | `http://192.168.1.100:8081` |
| **Production (Web)**         | `https://[DOMAINE]`        | `https://app.doc2sail.com`  |
| **Production (iOS/Android)** | Pas de CORS (natif)        | -                           |

---

## 📲 Configuration Frontend (Expo / React Native)

### 1. Installation dépendances

```bash
pnpm add axios
```

### 2. Configuration API Client

Créez `src/services/api.ts` :

```typescript
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

// URL API selon l'environnement
const API_BASE_URL = __DEV__
  ? 'http://192.168.1.100:8000'  // Votre IP locale en dev
  : 'https://api.doc2sail.com';   // Production

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true, // Important pour CORS avec credentials
});

// Intercepteur pour ajouter le JWT automatiquement
api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('jwt_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercepteur pour gérer refresh token (optionnel)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expiré → rediriger vers login
      await SecureStore.deleteItemAsync('jwt_token');
      // Navigation.navigate('Login')
    }
    return Promise.reject(error);
  }
);

export default api;
```

---

### 3. Service d'authentification Magic Link

Créez `src/services/auth.ts` :

```typescript
import api from './api';
import * as SecureStore from 'expo-secure-store';

export interface AuthResponse {
  token: string;
  user: {
    id: number;
    displayName: string;
    roles: string[];
  };
}

export const authService = {
  /**
   * Étape 1 : Demander un Magic Link
   */
  async requestMagicLink(email: string, displayName?: string): Promise<void> {
    const response = await api.post('/api/auth/request', {
      email,
      displayName,
    });
    
    if (!response.data.success) {
      throw new Error('Échec demande de code');
    }
  },

  /**
   * Étape 2 : Vérifier le code et obtenir JWT
   */
  async verifyCode(email: string, code: string): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/api/auth/verify', {
      email,
      code: code.toUpperCase(), // Code en majuscules
    });

    // Stocker le JWT de manière sécurisée
    await SecureStore.setItemAsync('jwt_token', response.data.token);
    await SecureStore.setItemAsync('user', JSON.stringify(response.data.user));

    return response.data;
  },

  /**
   * Déconnexion
   */
  async logout(): Promise<void> {
    await SecureStore.deleteItemAsync('jwt_token');
    await SecureStore.deleteItemAsync('user');
  },

  /**
   * Vérifier si connecté
   */
  async isAuthenticated(): Promise<boolean> {
    const token = await SecureStore.getItemAsync('jwt_token');
    return !!token;
  },

  /**
   * Obtenir utilisateur courant
   */
  async getCurrentUser(): Promise<any> {
    const userJson = await SecureStore.getItemAsync('user');
    return userJson ? JSON.parse(userJson) : null;
  },
};
```

---

### 4. Exemple d'écran Login

```typescript
// src/screens/LoginScreen.tsx
import React, { useState } from 'react';
import { View, TextInput, Button, Text, Alert } from 'react-native';
import { authService } from '../services/auth';

export default function LoginScreen({ navigation }) {
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequestCode = async () => {
    if (!email) return;
    
    setLoading(true);
    try {
      await authService.requestMagicLink(email);
      Alert.alert('✅ Code envoyé', 'Vérifiez vos emails');
      setStep('code');
    } catch (error) {
      Alert.alert('Erreur', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!code || code.length !== 6) {
      Alert.alert('Erreur', 'Code à 6 caractères requis');
      return;
    }

    setLoading(true);
    try {
      await authService.verifyCode(email, code);
      Alert.alert('✅ Connecté', 'Bienvenue !');
      navigation.replace('Home');
    } catch (error) {
      Alert.alert('Erreur', 'Code invalide ou expiré');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'email') {
    return (
      <View style={{ padding: 20 }}>
        <Text>Entrez votre email</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="email@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Button 
          title="Recevoir un code" 
          onPress={handleRequestCode}
          disabled={loading}
        />
      </View>
    );
  }

  return (
    <View style={{ padding: 20 }}>
      <Text>Entrez le code reçu par email</Text>
      <TextInput
        value={code}
        onChangeText={setCode}
        placeholder="ABC123"
        maxLength={6}
        autoCapitalize="characters"
      />
      <Button 
        title="Se connecter" 
        onPress={handleVerifyCode}
        disabled={loading}
      />
      <Button 
        title="Changer d'email" 
        onPress={() => setStep('email')}
      />
    </View>
  );
}
```

---

## 🔐 Sécurité Renforcée (Recommandé)

### 1. Device Fingerprinting

Pour détecter les vols de code, ajoutez un fingerprint unique :

```typescript
import * as Application from 'expo-application';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

async function getDeviceFingerprint(): Promise<string> {
  const data = {
    model: Device.modelName,
    brand: Device.brand,
    osVersion: Device.osVersion,
    appVersion: Application.nativeApplicationVersion,
    platform: Platform.OS,
  };
  
  // Hash simple (améliorer avec crypto pour production)
  const fingerprint = JSON.stringify(data);
  return btoa(fingerprint);
}

// Envoyer avec les requêtes auth
const fingerprint = await getDeviceFingerprint();
await api.post('/api/auth/request', {
  email,
  deviceFingerprint: fingerprint,
});
```

---

### 2. Gestion Erreurs CORS

Si vous rencontrez des erreurs CORS en développement :

```typescript
// Vérifier que l'IP locale est correcte
const getLocalIP = async () => {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    console.log('IP publique:', data.ip);
  } catch (error) {
    console.log('Utiliser IP locale : 192.168.x.x');
  }
};

// En dev, logger toutes les requêtes
if (__DEV__) {
  api.interceptors.request.use((config) => {
    console.log('🚀 Request:', config.method, config.url);
    return config;
  });
  
  api.interceptors.response.use(
    (response) => {
      console.log('✅ Response:', response.status);
      return response;
    },
    (error) => {
      console.error('❌ Error:', error.response?.status, error.message);
      return Promise.reject(error);
    }
  );
}
```

---

## 🚀 Déploiement Production

### 1. Configuration serveur backend

```bash
# Production .env
CORS_ALLOW_ORIGIN='^https://(app\.)?doc2sail\.com$'
APP_ENV=prod
APP_DEBUG=0
```

### 2. Build Expo

```bash
# iOS
eas build --platform ios --profile production

# Android
eas build --platform android --profile production

# Web
expo build:web
```

### 3. Variables d'environnement Expo

Créez `app.config.js` :

```javascript
export default {
  expo: {
    extra: {
      apiUrl: process.env.API_URL || 'https://api.doc2sail.com',
    },
  },
};
```

Utilisez dans le code :

```typescript
import Constants from 'expo-constants';
const API_URL = Constants.expoConfig?.extra?.apiUrl;
```

---

## 🧪 Tests

### Test CORS en développement

```bash
# Test preflight OPTIONS en production
curl -X OPTIONS https://doc2sail.com/api/auth/request \
  -H "Origin: https://app.doc2sail.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -i

# Doit retourner :
# Access-Control-Allow-Origin: https://app.doc2sail.com
# Access-Control-Allow-Methods: POST, OPTIONS
# Access-Control-Allow-Credentials: true

# Test preflight OPTIONS
curl -X OPTIONS http://localhost:8000/api/auth/request \
  -H "Origin: http://192.168.1.100:8081" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type,Authorization" \
  -v

# Doit retourner :
# Access-Control-Allow-Origin: http://192.168.1.100:8081
# Access-Control-Allow-Methods: POST, OPTIONS
# Access-Control-Allow-Credentials: true
```

---

## 📚 Ressources

- [Expo SecureStore](https://docs.expo.dev/versions/latest/sdk/securestore/)
- [Axios avec React Native](https://axios-http.com/docs/intro)
- [Nelmio CORS Bundle](https://github.com/nelmio/NelmioCorsBundle)
- [Expo Constants](https://docs.expo.dev/versions/latest/sdk/constants/)

---

## ⚠️ Checklist Sécurité

- [ ] CORS_ALLOW_ORIGIN configuré avec origines exactes (pas de wildcard)
- [ ] JWT stocké dans SecureStore (jamais AsyncStorage)
- [ ] HTTPS en production (pas HTTP)
- [ ] Device fingerprinting implémenté
- [ ] Gestion expiration token (401 → redirect login)
- [ ] Rate limiting respecté (pas de spam requêtes)
- [ ] Logs erreurs CORS désactivés en production
- [ ] SSL Pinning ajouté (optionnel, très sécurisé)

---

## 🆘 Troubleshooting

### Erreur "CORS policy blocked"
1. Vérifier que `CORS_ALLOW_ORIGIN` autorise exactement l'origine affichée par le navigateur, par exemple `https://app.doc2sail.com`
2. Si le preflight est `200` mais la requête `fetch` reste en erreur CORS, vérifier aussi les headers de la réponse réelle, pas seulement `OPTIONS`
3. Redémarrer Symfony / le conteneur après changement d'environnement
4. Vider cache : `php bin/console cache:clear`

### Erreur "Network request failed"
1. Vérifier backend est accessible : `curl http://IP:8000/api`
2. Vérifier firewall autorise port 8000
3. Utiliser IP locale (pas 127.0.0.1) en dev

### Code invalide ou expiré
1. Vérifier majuscules : code toujours en UPPERCASE
2. Code expire après 15 minutes
3. Un seul code actif par utilisateur
