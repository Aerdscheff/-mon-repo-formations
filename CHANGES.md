# Changements apportés (v5)

Cette refonte introduit une nouvelle esthétique et des fonctionnalités améliorées pour l'application de formations gamifiées.

## Design et accessibilité

- **Palette de couleurs** : adoption d'une palette inspirée de la charte aerdscheff.lu : fonds beiges (`--bg`), surfaces blanches (`--surface`), texte sombre (`--ink`), éléments d'accent verts et ocre (`--accent`, `--accent-2`).
- **Typographies** : utilisation des polices « Lato » et « Inter » pour un rendu moderne et lisible.
- **Composants arrondis** : cartes et boutons avec des bordures arrondies et ombres douces pour rappeler l'effet “grain papier”.
- **Réactivité** : la disposition s'adapte aux différentes largeurs d'écran et les images utilisent l'attribut `loading="lazy"` pour optimiser le chargement.
- **Accessibilité niveau AA** : contraste suffisant entre le texte et l'arrière‑plan, usage d'éléments interactifs accessibles au clavier et descriptions claires.

## Structure des fichiers

- `index.html` : nouvelle structure minimale qui charge la feuille de style `css/site.css`, le script principal `js/app.js` et le module admin `js/admin.js`. Le contenu est injecté dynamiquement dans `<div id="app">` selon le pack choisi.
- `css/site.css` : définit la palette, les composants (cartes, boutons, images) et l'overlay d'édition pour le mode admin.
- `js/app.js` : gère la logique de l'application : affichage du catalogue, chargement d'un pack (`packs/<pack>.json`), déroulement du quiz, feedback des réponses et persistance des scores via `localStorage`.
- `js/admin.js` : ajoute un mode administrateur activé via l'URL `?admin=1` ou `sessionStorage`. Un bouton « Éditer pack » apparaît en haut de page et ouvre un formulaire JSON en overlay permettant de modifier un pack et de télécharger le résultat. Cette fonctionnalité est côté client et n'écrit pas directement dans le dépôt : l'utilisateur peut ensuite créer une Pull Request manuellement en déposant le fichier modifié dans le dossier `packs/`.
- `packs/ia_enjeux.json` : exemple de pack converti au nouveau format (id, titre, couverture, liste de questions avec images et explications). D'autres packs sont listés dans `PACK_LIST` et chargés de la même manière.
- `images/` : inclusion de placeholders générés via [placehold.co](https://placehold.co) : une bannière (`images/headers/ia_enjeux.webp`), un header par défaut et trois vignettes pour les questions (`images/ia_enjeux/q1.webp` – `q3.webp`).

## Fonctionnalités principales

1. **Catalogue multi‑packs** : si aucun paramètre `pack` n’est fourni dans l’URL, la page d’accueil liste tous les packs disponibles avec leur couverture et un bouton « Commencer ».
2. **Affichage dynamique d’un pack** : l’URL `?pack=<id>` charge le fichier JSON correspondant (`packs/<id>.json`), affiche la couverture, puis déroule les questions une par une. Chaque question affiche une icône et ses choix ; un feedback s’affiche immédiatement après la sélection.
3. **Persistance des scores** : à la fin du quiz, le score est calculé et sauvegardé dans `localStorage` (`aerdscheff:scores:v1`). Cette information peut être utilisée ultérieurement pour afficher un tableau de bord ou un historique.
4. **Mode administrateur** : en ajoutant `?admin=1` à l’URL, un bouton « Éditer pack » apparaît. Ce mode ouvre un overlay contenant le JSON du pack courant pour le modifier. Le résultat peut être téléchargé et réintégré au dépôt via une Pull Request manuelle.
5. **Optimisation et sobriété** : l’ensemble du JavaScript (app.js + admin.js) reste en dessous de 50 Ko minifiés. Les images sont servies au format WebP et chargées en lazy‑loading pour réduire la consommation de données.

## Instructions pour les administrateurs

1. Pour activer le mode admin, ajouter `?admin=1` à l’URL du pack (ex. : `https://…/?pack=ia_enjeux&admin=1`).
2. Cliquer sur « Éditer pack » en haut de la page : un overlay s’ouvre avec le JSON du pack en cours.
3. Modifier le contenu (questions, intitulés, images, etc.) directement dans la zone de texte.
4. Cliquer sur « Télécharger » pour récupérer un fichier JSON nommé `pack_<id>.json`.
5. Déposer ce fichier dans le dossier `packs/` du dépôt via l’interface GitHub (ou GitHub Desktop) et ouvrir une Pull Request pour valider les modifications.

## Remarques

- Cette version n'inclut pas de compte utilisateur et n'interagit pas avec un backend : toutes les données sont stockées localement dans le navigateur.
- Pour ajouter de nouveaux packs, créer un fichier JSON dans le dossier `packs/` suivant la structure décrite dans `packs/ia_enjeux.json` et l'ajouter à la liste `PACK_LIST` dans `js/app.js`.