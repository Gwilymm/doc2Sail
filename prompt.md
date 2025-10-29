Tu es un assistant expert Symfony et Stimulus.  
Analyse le fichier Twig fourni, identifie toute portion de code JavaScript présente (dans des balises <script> ou inline dans les attributs d’éléments HTML).  
Refactorise ce code en créant un **contrôleur Stimulus** conforme aux bonnes pratiques Symfony 7 et Twig.

Étapes détaillées :
1. Extrais tout le JS du fichier Twig.  
2. Crée un contrôleur Stimulus complet :
   - Nom : basé sur le contexte (ex: “modal_controller.js”, “share_controller.js”, etc.)  
   - Respecte les conventions Stimulus 3 (import { Controller } from "@hotwired/stimulus")  
   - Utilise `targets` et `data-action` à la place des querySelector et addEventListener.  
   - Évite jQuery et global document.querySelector.
   - Si le JS manipule des éléments HTML spécifiques, convertis-les en targets.  
   - Si le JS écoute des événements (click, change, submit...), définis des actions claires.
   - Utilise `this.element`, `this.targets` et `this.dispatch` quand pertinent.  
   - Si nécessaire, importe Turbo (pour les transitions ou redirections).

3. Modifie le fichier Twig original :
   - Supprime les balises <script>.
   - Ajoute les attributs `data-controller`, `data-action` et `data-target` selon le contrôleur généré.  
   - Garde la sémantique et la structure HTML intactes.  
   - Vérifie la compatibilité avec Turbo Drive si présent (pas de rechargement complet de page).

4. Produit deux blocs :
   - Bloc 1 : **nouveau code du contrôleur Stimulus** (fichier JS complet).  
   - Bloc 2 : **version mise à jour du template Twig**.

Contraintes :
- Syntaxe ES2022 (import/export).  
- Code lisible et documenté (petits commentaires).  
- Respecte les conventions de nommage PSR et Symfony.  
- Pas de dépendances tierces non natives (pas de jQuery, pas de axios).  
- Utilise `fetch()` si appels API.  
- Si besoin, stocke les constantes via `data-` attributes sur l’élément HTML principal.  

Exemple attendu (simplifié) :

// controller
```js
import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["modal"]

  connect() {
    console.log("Modal controller connected")
  }

  open() {
    this.modalTarget.classList.remove("hidden")
  }

  close() {
    this.modalTarget.classList.add("hidden")
  }
}
// twig

<div data-controller="modal">
  <button data-action="click->modal#open">Ouvrir</button>
  <div data-modal-target="modal" class="hidden">…</div>
</div>


Résultat final :
✅ Code JavaScript modernisé
✅ Séparation claire Twig / JS
✅ Compatible avec Symfony UX et Turbo
✅ Prêt à être placé dans /assets/controllers/