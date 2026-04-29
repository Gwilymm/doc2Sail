# Hotwire Native avec Symfony UX Native

Doc2Sail expose deux configurations Hotwire Native generees par Symfony UX Native :

- iOS : `/native/ios_v1.json`
- Android : `/native/android_v1.json`

## Backend Symfony

Installer les dependances, compiler les assets et generer les configurations statiques :

```bash
composer install
pnpm install
pnpm run build
php bin/console ux-native:dump
```

En environnement `dev`, les fichiers JSON sont servis dynamiquement par Symfony. En production, `ux-native:dump` ecrit les fichiers dans `public/native/`.

## Clients mobiles

Les apps iOS et Android doivent rester des shells Hotwire Native qui pointent vers l'URL HTTPS de Doc2Sail. Elles ne doivent pas embarquer Symfony ni la base SQLite.

- Base URL : `https://doc2sail.com`
- Configuration iOS : `https://doc2sail.com/native/ios_v1.json`
- Configuration Android : `https://doc2sail.com/native/android_v1.json`

Le User-Agent des clients Hotwire Native doit contenir `Hotwire Native`. Les composants bridge pris en charge peuvent declarer `bridge-components: [share]` pour activer le partage natif depuis les pages de regate.

## Comportement garde cote web

La PWA web conserve ses manifests, service workers et notifications Web Push. En contexte natif, Symfony masque la navigation web globale, le footer et les blocs d'installation PWA qui sont remplaces par la shell native.
