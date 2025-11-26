# Formulaire de Connexion Doc2Sail

## 📋 Ce qui a été créé

### 1. **Composants UI** (via React Native Reusables CLI)
- ✅ `components/ui/input.tsx` - Champ de saisie
- ✅ `components/ui/label.tsx` - Label pour les formulaires  
- ✅ `components/ui/card.tsx` - Carte avec header/content/footer
- ✅ `components/ui/button.tsx` - Déjà existant
- ✅ `components/ui/text.tsx` - Déjà existant

### 2. **Services d'authentification**
- ✅ `lib/api.ts` - Client API pour communiquer avec Symfony
  - Login avec email/password
  - Refresh token automatique
  - Récupération des infos utilisateur
  - Stockage sécurisé des tokens (expo-secure-store)

- ✅ `lib/auth-context.tsx` - Contexte React pour gérer l'état d'authentification
  - Hook `useAuth()` pour accéder aux fonctions de connexion/déconnexion
  - Vérification automatique de l'authentification au démarrage

### 3. **Écrans**
- ✅ `app/sign-in.tsx` - Page de connexion avec formulaire
- ✅ `app/index.tsx` - Page d'accueil mise à jour avec état de connexion
- ✅ `app/_layout.tsx` - Layout racine avec AuthProvider

### 4. **Configuration**
- ✅ `.env` - Variables d'environnement (URL de l'API)
- ✅ `.env.example` - Exemple de configuration
- ✅ `.gitignore` - Mise à jour pour ignorer `.env`
- ✅ `AUTH_SETUP.md` - Documentation complète

## 🚀 Comment utiliser

### Démarrer l'application

```bash
cd doc2sail-app
pnpm dev
```

### Configuration de l'URL de l'API

Modifiez le fichier `.env`:
```
EXPO_PUBLIC_API_URL=http://192.168.1.10:8000
```

**Important**: Remplacez `192.168.1.10` par l'adresse IP de votre machine sur le réseau local.

### Tester la connexion

1. Lancez votre serveur Symfony (avec l'API)
2. Ouvrez l'app mobile
3. Cliquez sur "Sign In"
4. Entrez vos identifiants
5. Vous serez redirigé vers la page d'accueil si la connexion réussit

## 🔐 Endpoints Symfony requis

Votre API Symfony doit exposer:

- `POST /api/login` - Authentification JWT
- `POST /api/token/refresh` - Rafraîchissement du token
- `GET /api/me` - Récupération des infos utilisateur

Voir `AUTH_SETUP.md` pour les détails des requêtes/réponses.

## 📱 Fonctionnalités

- ✅ Connexion avec email/password
- ✅ Stockage sécurisé des tokens JWT
- ✅ Refresh automatique du token expiré
- ✅ Déconnexion
- ✅ État de chargement pendant les requêtes
- ✅ Gestion des erreurs avec affichage utilisateur
- ✅ Persistance de la session (reste connecté après fermeture)
- ✅ Support iOS/Android/Web

## 🎨 Design

Le formulaire utilise les composants de React Native Reusables, inspirés de shadcn/ui, avec:
- Mode clair/sombre automatique
- Animations fluides
- Accessibilité intégrée
- Design responsive

## 🔧 Prochaines étapes suggérées

- [ ] Créer une page d'inscription (`/sign-up`)
- [ ] Ajouter la réinitialisation de mot de passe
- [ ] Protéger les routes nécessitant une authentification
- [ ] Ajouter des indicateurs de force du mot de passe
- [ ] Implémenter la connexion avec OAuth (Google, Apple, etc.)
