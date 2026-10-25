# Instructions pour l'IA · Voisin d'Or

## Le projet

Voisin d'Or met en relation des jeunes volontaires, des personnes âgées et leurs proches pour des petits services de quartier (courses, ménage, bricolage, informatique, jardinage, cuisine).

Scénario minimal : le jeune publie son annonce (services + créneaux) ; le demandeur (personne âgée ou proche) cherche un jeune par service, distance et jour, envoie une demande sur un créneau ; le jeune accepte ou refuse ; le numéro de téléphone s'affiche seulement après acceptation.

## Sources de vérité

- `specs/user-stories.md` : EPICs et user stories (critères d'acceptation = ce qu'il faut tester).
- `specs/openapi.yaml` : routes et schémas de données.
- `specs/uml.mmd` : modèle de données.
- `specs/donnees.json` : données fictives.
- `design/index.html` : maquette et charte graphique.

Avant de coder une fonctionnalité, lire l'US correspondante. Ne pas coder ce qui n'est pas dans les US.

## Structure

- `src/` et `public/` : application React (front).
- `src/services/api.js` : toute la logique métier. Les écrans n'appellent jamais Firestore directement.
- `src/services/stockageFirebase.js` : Firebase Auth (lien par e-mail) et Firestore.
- `src/services/stockageTest.js` : même interface en localStorage, utilisée par les tests (`REACT_APP_MODE=test`).
- `workers/` : worker Cloudflare (géocodage d'adresse).
- `landing/` : site vitrine.
- `tests/` : tests Playwright.

## Règles

- Nom du produit : Voisin d'Or. Rôles : JEUNE, SENIOR, ACCOMPAGNANT. Statuts de demande : ENVOYEE, ACCEPTEE, REFUSEE, ANNULEE.
- Textes en français simple, sans faute, phrases courtes, boutons avec un verbe.
- Mobile d'abord. Couleurs et polices de la charte (`src/index.css`).
- Ne jamais afficher le téléphone ou l'adresse exacte avant une demande acceptée.
- Pas de commentaires dans le code. Noms de variables en français.
- Chaque nouvelle US doit avoir au moins un test Playwright dans `tests/e2e/`, avec le numéro de l'US dans le nom du test.
- Après une modification : `npm run build` puis `npm test` doivent passer.
