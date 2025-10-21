# Système de QR Code pour Doc2Sail

Ce système permet de générer et afficher des QR codes dans une modal interactive avec options de partage et d'impression.

## 🎯 Fonctionnalités

- ✅ Génération de QR code dynamique
- ✅ Modal responsive avec DaisyUI
- ✅ Impression du QR code
- ✅ Téléchargement en PNG
- ✅ Partage par WhatsApp
- ✅ Partage par Email
- ✅ Partage natif (Web Share API)
- ✅ Copie de l'URL dans le presse-papiers
- ✅ Notifications toast

## 📦 Installation

Le système est déjà configuré avec :
- `endroid/qr-code` (PHP)
- Stimulus controller pour les interactions
- Templates Twig avec DaisyUI

## 🚀 Utilisation

### Méthode 1 : Bouton réutilisable (Recommandé)

Utilisez le partial `_button.html.twig` dans vos templates :

```twig
{# Bouton simple #}
{% include 'qrcode/_button.html.twig' with {
    'type': 'regatta',
    'id': regatta.id
} %}

{# Bouton personnalisé #}
{% include 'qrcode/_button.html.twig' with {
    'type': 'document',
    'id': document.id,
    'label': 'Partager le document',
    'btn_class': 'btn-accent',
    'size': 'md',
    'icon_only': false
} %}

{# Bouton icône seulement #}
{% include 'qrcode/_button.html.twig' with {
    'type': 'regatta',
    'id': regatta.id,
    'icon_only': true,
    'size': 'sm',
    'tooltip': 'Afficher le QR code'
} %}
```

### Méthode 2 : Bouton personnalisé

Créez votre propre bouton et appelez la fonction JavaScript :

```html
<button onclick="loadQRCodeModal('regatta', '{{ regatta.id }}')" class="btn btn-primary">
    <svg>...</svg>
    Code QR
</button>
```

### Méthode 3 : Intégration dans votre page

Ajoutez le conteneur pour la modal dans votre template de base :

```twig
{# templates/base.html.twig ou votre layout #}
<div id="qrCodeModalContainer"></div>
```

## 🎨 Paramètres du bouton

| Paramètre | Type | Défaut | Description |
|-----------|------|--------|-------------|
| `type` | string | `'home'` | Type de contenu : 'document', 'regatta', 'home' |
| `id` | string/int | `null` | ID de l'entité (optionnel) |
| `label` | string | `'Code QR'` | Texte du bouton |
| `btn_class` | string | `'btn-primary'` | Classes CSS DaisyUI du bouton |
| `size` | string | `'sm'` | Taille : 'xs', 'sm', 'md', 'lg' |
| `icon_only` | boolean | `false` | Afficher uniquement l'icône |
| `tooltip` | string | `null` | Texte du tooltip (automatique si icon_only) |

## 🔧 Configuration des routes

Le contrôleur `QRCodeController` expose trois routes :

### 1. Génération d'image QR code simple
```php
#[Route('/qrcode/generate', name: 'app_qrcode_generate')]
```

### 2. Modal avec QR code
```php
#[Route('/qrcode/modal/{type}/{id}', name: 'app_qrcode_modal', defaults: ['id' => null])]
```

### 3. Image QR code seule
```php
#[Route('/qrcode/image/{type}/{id}', name: 'app_qrcode_image', defaults: ['id' => null])]
```

## 🎯 Ajouter un nouveau type de QR code

1. Modifiez `src/Controller/QRCodeController.php`
2. Ajoutez votre type dans le `match` :

```php
$url = match($type) {
    'document' => $id ? $this->generateUrl('app_document_view', ['id' => $id], UrlGeneratorInterface::ABSOLUTE_URL) : null,
    'regatta' => $id ? $this->generateUrl('app_regatta_view', ['id' => $id], UrlGeneratorInterface::ABSOLUTE_URL) : null,
    'home' => $this->generateUrl('app_home', [], UrlGeneratorInterface::ABSOLUTE_URL),
    'mon_type' => $id ? $this->generateUrl('ma_route', ['id' => $id], UrlGeneratorInterface::ABSOLUTE_URL) : null,
    default => $this->generateUrl('app_home', [], UrlGeneratorInterface::ABSOLUTE_URL),
};
```

## 📱 Fonctionnalités de partage

### Copier l'URL
Copie automatiquement l'URL dans le presse-papiers avec feedback visuel.

### Imprimer
Lance l'impression du QR code uniquement (sans la modal).

### Télécharger
Télécharge le QR code en PNG avec timestamp.

### WhatsApp
Ouvre WhatsApp (web ou app) avec un message pré-rempli contenant l'URL.

### Email
Ouvre le client email par défaut avec un email pré-rempli.

### Partage natif
Utilise l'API Web Share (disponible sur mobile et certains navigateurs desktop) pour partager l'URL et l'image du QR code.

## 🎨 Personnalisation du design

Le système utilise DaisyUI et TailwindCSS. Vous pouvez personnaliser :

### Taille du QR code
Dans `QRCodeController.php` :
```php
->size(400) // Modifier cette valeur (en pixels)
->margin(10) // Marge autour du QR code
```

### Niveau de correction d'erreur
```php
->errorCorrectionLevel(ErrorCorrectionLevel::High)
// Options : Low, Medium, Quartile, High
```

### Couleurs du QR code
Ajoutez dans le builder :
```php
->foregroundColor(new Color(0, 0, 0))
->backgroundColor(new Color(255, 255, 255))
```

## 🐛 Dépannage

### Le QR code ne s'affiche pas
- Vérifiez que le conteneur `#qrCodeModalContainer` existe dans votre page
- Vérifiez la console du navigateur pour les erreurs
- Vérifiez que les routes sont accessibles

### La fonction `loadQRCodeModal` n'existe pas
- Assurez-vous d'inclure le bouton partial au moins une fois dans votre page
- Ou ajoutez manuellement le script dans votre layout

### Le partage natif ne fonctionne pas
- L'API Web Share n'est disponible que sur HTTPS (sauf localhost)
- Tous les navigateurs ne supportent pas cette API
- Le bouton se masque automatiquement si non supporté

### Les notifications ne s'affichent pas
Le contrôleur Stimulus intègre un fallback pour créer des toasts DaisyUI manuellement si Symfony UX Notify n'est pas disponible.

## 📝 Exemple complet

```twig
{# templates/regatta/documents.html.twig #}

{% extends 'base.html.twig' %}

{% block body %}
    <div class="container mx-auto p-4">
        <h1>{{ regatta.name }}</h1>
        
        {# Bouton QR code #}
        <div class="flex gap-2">
            {% include 'qrcode/_button.html.twig' with {
                'type': 'regatta',
                'id': regatta.id,
                'label': 'Partager la régate',
                'btn_class': 'btn-primary'
            } %}
        </div>
        
        {# ... votre contenu ... #}
    </div>
    
    {# Conteneur pour la modal (à ajouter une seule fois par page) #}
    <div id="qrCodeModalContainer"></div>
{% endblock %}
```

## 🔒 Sécurité

- Les QR codes sont générés côté serveur
- Les URLs sont toujours absolues pour un fonctionnement optimal
- Validation des paramètres dans le contrôleur
- Protection contre les injections via l'escaping Twig

## 📚 Ressources

- [Endroid QR Code Documentation](https://github.com/endroid/qr-code)
- [DaisyUI Components](https://daisyui.com/components/)
- [Stimulus Documentation](https://stimulus.hotwired.dev/)
- [Web Share API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Share_API)

## 📄 Licence

Ce système fait partie du projet Doc2Sail.