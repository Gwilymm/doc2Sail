# Clients Hotwire Native Doc2Sail

Ce dossier reserve l'emplacement des shells mobiles Hotwire Native.

- `ios/` : client Swift Hotwire Native pointant vers `/native/ios_v1.json`
- `android/` : client Kotlin Hotwire Native pointant vers `/native/android_v1.json`

Symfony reste l'application distante servie en HTTPS. Les clients mobiles ne doivent pas embarquer le runtime Symfony, SQLite ou les fichiers uploades.
