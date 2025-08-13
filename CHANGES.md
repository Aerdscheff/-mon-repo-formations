# Changements apportés (v6)

Cette itération poursuit la refonte graphique et ajoute des correctifs de chemins, un thème éditable, une meilleure gestion des images et une persistance de scores plus fiable.

## Design et accessibilité

- **Palette de couleurs** : adoption d'une palette inspirée de la charte aerdscheff.lu : fonds beiges (`--bg`), surfaces blanches (`--surface`), texte sombre (`--ink`), éléments d'accent verts et ocre (`--accent`, `--accent-2`).
- **Typographies** : utilisation des polices « Lato » et « Inter » pour un rendu moderne et lisible.
- **Composants arrondis** : cartes et boutons avec des bordures arrondies et ombres douces pour rappeler l'effet “grain papier”.
- **Réactivité** : la disposition s'adapte aux différentes largeurs d'écran et les images utilisent l'attribut `loading="lazy"` pour optimiser le chargement.
- **Accessibilité niveau AA** : contraste suffisant entre le texte et l'arrière‑plan, usage d'éléments interactifs accessibles au clavier et descriptions claires.

## Structure des fichiers

- `index.html` : structure minimale qui charge la feuille de style locale `site.css` et, désormais, le thème `design/theme.css` ainsi qu'un thème distant éditable (préchargé depuis `aerdscheff.lu`). Les scripts `app.js` et `admin.js` sont maintenant chargés en modules (`type="module"`) pour permettre l'import ES6.
- `css/site.css` : définit la palette, les composants (cartes, boutons, images) et l'overlay d'édition pour le mode admin. Un nouveau thème complémentaire est fourni dans `design/theme.css` pour refléter la charte Äerdschëff.
- `design/theme.css` : contient les variables CSS et styles principaux inspirés de la charte aerdscheff.lu (couleurs, arrondis, ombres, responsive) et peut être surchargé par un thème distant chargé via `<link rel="preload">`.
- `utils/paths.js` : fournit la fonction `asset(path)` qui résout correctement les chemins des assets (packs, images) en tenant compte du sous-chemin GitHub Pages (`/repo/…`) en production. En local, les chemins sont relatifs.
- `js/scores.js` : encapsule la persistance des scores dans `localStorage` avec un identifiant stable. Fournit `loadScores()`, `getScore()` et `saveScore()`.
- `js/app.js` : gère la logique de l'application : affichage du catalogue, chargement d'un pack (via `asset('packs/<id>.json')`), déroulement du quiz, feedback des réponses et persistance des scores via `js/scores.js`. Toutes les images (couvertures et vignettes) sont résolues via `asset()` pour fonctionner aussi bien en local que sur GitHub Pages. Le score final est sauvegardé via `saveScore()`.
- `js/admin.js` : ajoute un mode administrateur activé via l'URL `?admin=1` ou `sessionStorage`. Un bouton « Éditer pack » apparaît en haut de page et ouvre un formulaire JSON en overlay permettant de modifier un pack et de télécharger le résultat. Cette fonctionnalité est côté client et n'écrit pas directement dans le dépôt : l'utilisateur peut ensuite créer une Pull Request manuellement en déposant le fichier modifié dans le dossier `packs/`.
- `packs/ia_enjeux.json` : exemple de pack converti au nouveau format (id, titre, couverture, liste de questions avec images et explications). D'autres packs sont listés dans `PACK_LIST` et chargés de la même manière.
- `images/` : inclusion de placeholders générés via [placehold.co](https://placehold.co) : une bannière (`images/headers/ia_enjeux.webp`), un header par défaut et trois vignettes pour les questions (`images/ia_enjeux/q1.webp` – `q3.webp`).

## Fonctionnalités principales

1. **Catalogue multi‑packs** : si aucun paramètre `pack` n’est fourni dans l’URL, la page d’accueil liste tous les packs disponibles avec leur couverture et un bouton « Commencer ».
2. **Affichage dynamique d’un pack** : l’URL `?pack=<id>` charge le fichier JSON correspondant (`packs/<id>.json`), affiche la couverture, puis déroule les questions une par une. Chaque question affiche une icône et ses choix ; un feedback s’affiche immédiatement après la sélection.
3. **Persistance des scores** : à la fin du quiz, le score est calculé et sauvegardé dans `localStorage` (`aerdscheff:scores:v1`). Cette information peut être utilisée ultérieurement pour afficher un tableau de bord ou un historique.
3. **Persistance des scores améliorée** : à la fin du quiz, le score (en %) est calculé et sauvegardé dans `localStorage` (`aerdscheff:scores:v1`) via `js/scores.js`. La structure stocke également la date. Le score persiste après rechargement et peut être récupéré via `getScore(pack)`.
4. **Mode administrateur** : en ajoutant `?admin=1` à l’URL, un bouton « Éditer pack » apparaît. Ce mode ouvre un overlay contenant le JSON du pack courant pour le modifier. Le résultat peut être téléchargé et réintégré au dépôt via une Pull Request manuelle.
5. **Optimisation et sobriété** : l’ensemble du JavaScript (app.js + admin.js) reste en dessous de 50 Ko minifiés. Les images sont servies au format WebP et chargées en lazy‑loading pour réduire la consommation de données.
5. **Correctifs de chemins** : l’utilitaire `asset()` résout automatiquement les chemins relatifs en prenant en compte le contexte (GitHub Pages vs local). Les packs (`packs/<id>.json`) et toutes les images sont chargés via `asset()` afin d’éviter les erreurs 404 lorsque l’application est déployée sous un sous-dossier GitHub Pages.

## Instructions pour les administrateurs

1. Pour activer le mode admin, ajouter `?admin=1` à l’URL du pack (ex. : `https://…/?pack=ia_enjeux&admin=1`).
2. Cliquer sur « Éditer pack » en haut de la page : un overlay s’ouvre avec le JSON du pack en cours.
3. Modifier le contenu (questions, intitulés, images, etc.) directement dans la zone de texte.
4. Cliquer sur « Télécharger » pour récupérer un fichier JSON nommé `pack_<id>.json`.
5. Déposer ce fichier dans le dossier `packs/` du dépôt via l’interface GitHub (ou GitHub Desktop) et ouvrir une Pull Request pour valider les modifications. Veillez à utiliser des chemins relatifs pour les images dans le JSON (ex. `"images/ia_enjeux/q4.webp"`) afin que la fonction `asset()` puisse les résoudre correctement.

## Remarques

- Cette version n'inclut pas de compte utilisateur et n'interagit pas avec un backend : toutes les données sont stockées localement dans le navigateur.
- Pour ajouter de nouveaux packs, créer un fichier JSON dans le dossier `packs/` suivant la structure décrite dans `packs/ia_enjeux.json` et l'ajouter à la liste `PACK_LIST` dans `js/app.js`.