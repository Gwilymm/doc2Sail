# Gestion de la propriété des régates

## 🔐 Sécurité et isolation des données

Depuis cette mise à jour, chaque régate est **strictement liée à son créateur** :

### ✅ Ce qui a été implémenté

1. **Rattachement automatique** : Chaque régate créée est automatiquement attribuée à l'utilisateur connecté
2. **Isolation des données** : Un utilisateur ne peut voir **que ses propres régates**
3. **Contrôle d'accès** : Les actions suivantes sont protégées :
   - ✏️ Modification d'une régate
   - 🗑️ Suppression d'une régate
   - 📄 Consultation des documents d'une régate

### 🚫 Restrictions

- Un utilisateur **ne peut pas** voir les régates des autres utilisateurs
- Un utilisateur **ne peut pas** modifier ou supprimer les régates d'autres utilisateurs
- Un utilisateur **ne peut pas** accéder aux documents des régates d'autres utilisateurs

### 🔓 Accès public

La fonctionnalité d'**accès public via token** reste disponible :
- Route : `/r/{token}` 
- Permet de partager une régate et ses documents sans authentification
- Le token est généré automatiquement à la création de la régate

## 📋 Routes protégées

| Route                     | Protection                 | Description                                      |
| ------------------------- | -------------------------- | ------------------------------------------------ |
| `/regatta`                | ✅ Authentification requise | Liste uniquement les régates de l'utilisateur    |
| `/regatta/create`         | ✅ Authentification requise | Crée une régate rattachée à l'utilisateur        |
| `/regatta/{id}/update`    | ✅ Propriétaire uniquement  | Modification réservée au propriétaire            |
| `/regatta/{id}/delete`    | ✅ Propriétaire uniquement  | Suppression réservée au propriétaire             |
| `/regatta/{id}/documents` | ✅ Propriétaire uniquement  | Documents accessibles uniquement au propriétaire |
| `/r/{token}`              | 🌐 Public                   | Accès public via token de partage                |

## 🗄️ Structure de la base de données

### Table `regatta`
```sql
- owner_id: INTEGER NOT NULL (clé étrangère vers user.id)
- Contrainte : ON DELETE CASCADE (suppression des régates si l'utilisateur est supprimé)
```

### Table `user`
```sql
- id: INTEGER PRIMARY KEY
- email_hash: VARCHAR(255) UNIQUE NOT NULL (email hashé avec Argon2id)
- display_name: VARCHAR(100) NULLABLE
- created_at: DATETIME NOT NULL
- last_login_at: DATETIME NULLABLE
```

## 🔄 Migration

La migration `Version20251014190832` a été appliquée avec succès :
- Ajout de la contrainte `NOT NULL` sur `regatta.owner_id`
- Attribution automatique des régates existantes au premier utilisateur
- Création d'un utilisateur par défaut si nécessaire

## 💡 Utilisation

### Pour l'utilisateur
1. Se connecter via Magic Link (`/login`)
2. Créer des régates depuis la page d'administration (`/regatta`)
3. Seules vos régates sont visibles et modifiables

### Pour partager une régate
1. Copier le lien public de la régate (contient le token)
2. Partager ce lien avec les participants
3. Le lien est accessible sans authentification

## 🔧 Développement

### Récupérer l'utilisateur courant dans un contrôleur
```php
private function getCurrentUser(Request $request): ?User
{
    $session = $request->getSession();
    $userId = $session->get('user_id');

    if (!$userId) {
        return null;
    }

    return $this->userRepository->find($userId);
}
```

### Filtrer les régates par propriétaire
```php
$regattas = $this->regattaRepository->findBy(
    ['owner' => $currentUser],
    ['startDate' => 'DESC']
);
```

### Vérifier les permissions
```php
if (!$currentUser || $regatta->getOwner() !== $currentUser) {
    return new JsonResponse(['error' => 'Accès refusé'], 403);
}
```
