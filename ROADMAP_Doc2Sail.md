# 🧭 Roadmap Technique Doc2Sail (2025–2026)

## ⚙️ Phase 1 — Sécurité & Fiabilité (Q4 2025)

### 🔐 Sécurisation Documentaire
- [ ] **Renforcer l’authentification/autorisation** sur toutes les routes du `DocumentController`  
  → Vérifier systématiquement les droits utilisateur (upload, download, delete, search)  
  → Corriger l’exposition croisée inter-régates  
  **🎯 Tâche :** Sécuriser les routes documentaires  

- [ ] **Limiter l’exposition des données retournées**  
  → Filtrer les résultats par régate et par utilisateur  
  **🎯 Tâche :** Isoler les résultats de recherche par régate  

- [ ] **Durcir la chaîne d’upload**  
  → Permissions des répertoires (`0750` max)  
  → Ajout contrôle antivirus et validation de signature  
  → Stockage chiffré des fichiers  
  **🎯 Tâche :** Durcir le stockage des fichiers  

- [ ] **Audit des partages publics**  
  → Suivi des accès via tokens  
  → Système de révocation de liens  
  → Historique d’utilisation (logs)  
  **🎯 Tâche :** Gérer la révocation et l’audit des liens publics  

---

## 🧩 Phase 2 — Optimisation & Observabilité (Q1 2026)

### ⚡ Performance & Codebase
- [ ] **Optimiser la recherche utilisateur** (`UserRepository::findByEmail`)  
  → Passage à une requête SQL indexée  
  **🎯 Tâche :** Optimiser la recherche utilisateur par email  

- [ ] **Centraliser la journalisation serveur**  
  → Passage à Monolog centralisé (fichier + API monitoring)  
  → Uniformiser les retours HTTP et logs d’erreurs  
  **🎯 Tâche :** Centraliser la gestion des erreurs et journaux  

- [ ] **Asynchroniser les notifications**  
  → Déléguer à une file de messages (RabbitMQ / Symfony Messenger)  
  → Découpler Mercure & WebPush du cycle HTTP  
  **🎯 Tâche :** Asynchroniser l’envoi de notifications  

---

## 🚀 Phase 3 — Fonctionnalités MVP Étendues (Q2 2026)

### 📂 Conformité & Gouvernance
- [ ] **Mettre en place un suivi de conformité documentaire**  
  → Suivi des dates d’expiration, alertes automatiques  
  → Tableau de bord de conformité par régate  
  **🎯 Tâche :** Suivi de conformité documentaire  

- [ ] **Gestion avancée des rôles**  
  → Ajouter les rôles `Organisateur`, `Jury`, `Skipper`, `Comité`  
  → Droits différenciés par action  
  **🎯 Tâche :** Introduire des rôles de régate différenciés  

- [ ] **Finaliser le mode offline PWA**  
  → Corriger le cache des sous-dossiers de régate  
  → Vérifier la restauration des documents en mer  
  **🎯 Tâche :** Finaliser le mode offline complet  

- [ ] **Préparer les connecteurs externes (FFVoile, ORC, IRC)**  
  → API d’import automatique depuis fédérations / jauges  
  → Synchronisation des métadonnées  
  **🎯 Tâche :** Préparer les connecteurs fédérations/jauges  

---

## 🧪 Phase 4 — Tests & Qualité (Q3 2026)

### 🧰 Validation technique
- [ ] **Mise en place de la suite de tests automatisés**  
  → Tests unitaires + fonctionnels sur routes critiques  
  → Tests d’intégration sur l’upload/download  
  → Linter + analyse statique (PHPStan, Psalm)  
  **🎯 Tâche :** Couverture de test >70% du code  

- [ ] **Tests de charge et sécurité**  
  → Vérifier le comportement à 100+ régates simultanées  
  → Simuler des uploads massifs  
  → Audit OWASP (injections, XSS, CSRF, etc.)  

---

## 📊 Synthèse par Thématique

| Thème | Objectif | Tâches principales | Priorité |
|-------|-----------|-------------------|-----------|
| **Sécurité** | Protéger les données et accès | Authentification, isolation, révocation | 🔥 Haute |
| **Performance** | Améliorer la scalabilité | Requêtes optimisées, logs, async | ⚡ Moyenne |
| **Fonctionnalités** | Couvrir les besoins métier | Rôles, conformité, offline, connecteurs | 🚀 Haute |
| **Qualité** | Fiabilité & conformité RGPD | Tests unitaires, intégration, sécurité | 🧪 Haute |
