# m2gdp-g2-sol

Application de proposition de services solidaires intergénérationnelles.

## Présentation " Voisin d'Or "
**Petits services. Grands liens.**

Voisin d'Or met en relation des jeunes du quartier avec des personnes âgées et leurs proches pour des petits services : courses, ménage, bricolage, informatique, jardinage, cuisine.

## Le dépôt

| Dossier | Contenu |
|---|---|
| `src/` et `public/` | Application (React + Supabase, Firebase en secours) |
| `supabase/` | Schéma de la base Supabase (tables, sécurité, photos) |
| `workers/` | Worker Cloudflare (adresse → position) |
| `landing/` | Site vitrine |
| `design/` | Dossier de conception : maquette, charte, Lean Canvas, roadmap, user stories |
| `specs/` | UML, OpenAPI, user stories, données fictives |
| `tests/` | Tests Playwright |
| `docs/` | Guide technique |

## Lancer l'application
    npm install
    npm start
    npm test

## Hébergement en France / UE
- Application : Vercel
- Base de données, connexion, photos : Supabase (région Paris, eu-west-3)

Variables d'environnement à définir (Vercel ou fichier `.env.local`) :

    REACT_APP_BACKEND=supabase
    REACT_APP_SUPABASE_URL=https://<projet>.supabase.co
    REACT_APP_SUPABASE_KEY=<clé publishable>

Sans `REACT_APP_BACKEND`, l'application utilise Firebase comme avant. `REACT_APP_MODE=test` lance le mode test sans serveur.

Import des données fictives dans Supabase :

    SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npm run donnees:supabase

## Équipe
- Product Owner : Manel SAADANE
- Designer : Sofiane TADIMI
- Développement : Youmna AHAMEDALI et Sara OUABOU
