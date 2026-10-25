# Guide technique · Voisin d'Or

## Installer

```bash
npm install
npx playwright install chromium
```

## Lancer l'application

```bash
npm start
```

L'application utilise le projet Firebase `granny-help-2561a` (Authentication par lien e-mail + Firestore).

Pour tester sans Firebase, avec les données fictives de `specs/donnees.json` chargées par les tests :

```bash
REACT_APP_MODE=test npm start
```

## Tests

```bash
npm test
```

Les tests Playwright démarrent l'application en mode test sur le port 3100. Les résultats sont dans `tests/resultats/` (rapport HTML et JSON).

## Données fictives dans Firestore

1. Firebase Console → Paramètres du projet → Comptes de service → Générer une clé privée.
2. Lancer :

```bash
GOOGLE_APPLICATION_CREDENTIALS=chemin/vers/cle.json npm run donnees
```

Ne jamais mettre la clé dans le dépôt.

## Installation de gCloud, authentification et application des règles CORS
```bash
winget install Google.CloudSDK
gcloud auth application-default login
gcloud storage buckets update gs://VOTRE_NOM_DE_BUCKET --cors-file=cors.json
```
## Déployer

```bash
npm install -g firebase-tools
firebase login
firebase hosting:sites:create voisin-dor-g2
npm run deploy
```

- Application : https://granny-help-2561a.web.app/inscription
- Site vitrine : https://voisin-dor-g2.web.app/

Worker de géocodage :

```bash
cd workers
npx wrangler deploy
```

Puis mettre l'URL du worker dans `.env.local` : `REACT_APP_WORKER_URL=https://voisin-dor-api.<compte>.workers.dev`. Sans cette variable, l'application appelle directement la Base Adresse Nationale.

## Architecture

| Partie | Outil | Rôle |
|---|---|---|
| Front | React (`src/`, `public/`) | Écrans du scénario minimal, mobile d'abord |
| Authentification | Firebase Auth | Connexion sans mot de passe par lien e-mail |
| Données | Firestore | Collections `users`, `demandes`, `rendezVous` |
| Règles | `firestore.rules` | Chacun modifie ses données ; seul le jeune accepte ou refuse ; seul le demandeur annule |
| Back | Cloudflare Worker (`workers/`) | Géocodage de l'adresse en latitude / longitude |
| Hébergement | Firebase Hosting | Application (`build/`) et site vitrine (`landing/`) |

## Modèle Firestore

- `users/{uid}` : profil (prénom, nom, e-mail, téléphone, rôle, adresse, latitude, longitude). Pour un jeune : `services`, `disponibilites`, `description`, `annoncePubliee`. Pour un proche aidé : `accompagnantId`.
- `demandes/{id}` : demande envoyée à un jeune sur un de ses créneaux, avec son `statut`.
- `rendezVous/{idDemande}` : créé quand le jeune accepte, avec les deux numéros de téléphone.

Les services proposés et les créneaux sont rangés dans le profil du jeune (tableaux) : ce sont les classes `ServiceUtilisateur` et `Disponibilite` de l'UML.
