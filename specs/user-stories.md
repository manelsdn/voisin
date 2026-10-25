# Voisin d'Or - Roadmap V2 et user stories

Roadmap V2 validée avec Sara et Youmna (DEV) le 28 septembre 2026.

## Scénarios

- **Minimal (MUST)** : Lucas publie son annonce ; Camille cherche un jeune proche et disponible, consulte son profil et lui envoie une demande sur un de ses créneaux ; Lucas accepte et les numéros s'affichent.
- **Cible (SHOULD + COULD)** : messagerie, carte, suivi des services, avis, puis les demandes des clients : photos et vocal, annonce assistée par IA, infos locales.

## EPICs

| EPIC | Besoin | Hypothèse | Approche retenue | Scénario | Priorité |
|---|---|---|---|---|---|
| 🔐 Accès simple | Les utilisateurs veulent entrer vite dans l'app, sans mot de passe à retenir. | Si l'inscription tient sur un écran court, plus de personnes âgées et de proches iront jusqu'au bout. | Inscription avec prénom, nom, e-mail et téléphone. Connexion par lien reçu par e-mail. Déconnexion. | Minimal | MUST |
| 👥 Rôles | Madeleine, Camille et Lucas n'ont pas le même parcours. | Choisir son rôle dès le début évite de montrer des écrans inutiles. | Trois rôles : personne âgée, proche accompagnateur, jeune volontaire. L'accueil change selon le rôle. | Minimal | MUST |
| 🧓 Proche accompagné | Madeleine n'a pas toujours de smartphone ; Camille organise l'aide pour elle. | Les proches seront les premiers utilisateurs de l'app. | Camille ajoute le profil de Madeleine (prénom, adresse) avec son accord. Madeleine n'a pas besoin de compte. | Minimal | MUST |
| 📍 Profil et localisation | Il faut savoir où habite chacun pour proposer de l'aide proche. | Une aide à moins de 2 km a plus de chances d'être acceptée. | Adresse, code postal et ville convertis en position. L'adresse exacte n'est jamais affichée. Modification du profil. | Minimal | MUST |
| 📢 Annonce du jeune | Les jeunes veulent dire ce qu'ils savent faire et quand ils sont libres. | Un jeune qui publie ses créneaux reçoit des demandes plus adaptées. | Le jeune publie une annonce : services proposés, créneaux (jour, heure de début, heure de fin) et une courte présentation. | Minimal | MUST |
| 🏠 Accueil | L'utilisateur doit comprendre tout de suite quoi faire. | Un accueil adapté au rôle réduit les abandons. | Rôle et ville visibles, bloc « Pour Madeleine », raccourcis vers les actions principales, barre de navigation en bas. | Minimal | MUST |
| 🔎 Recherche | Camille ou Madeleine veut trouver un jeune proche et libre. | Trois filtres suffisent pour trouver une aide rapidement. | Filtres service, distance et disponibilité. Liste triée du plus proche au plus éloigné. Profil du jeune consultable. | Minimal | MUST |
| 📨 Demande de service | Le jeune doit comprendre le besoin avant de dire oui. | Une demande claire liée à un créneau du jeune est plus souvent acceptée. | Le demandeur choisit un jeune, un de ses services et un de ses créneaux, puis ajoute des précisions. Il peut annuler tant que ce n'est pas accepté. | Minimal | MUST |
| ✅ Réponse et rendez-vous | Chacun veut savoir si le service aura lieu, sans donner son numéro trop tôt. | Montrer le numéro seulement après acceptation rassure les familles. | Le jeune accepte ou refuse. Si c'est accepté, le rendez-vous est créé et les numéros deviennent visibles. Suivi des demandes dans « Mes services ». | Minimal | MUST |
| 💬 Messagerie | Les deux personnes veulent régler les détails avant le rendez-vous. | Pouvoir écrire avant d'appeler met plus à l'aise les jeunes et les proches. | Conversation simple entre le demandeur et le jeune, liée à une demande. | Cible | SHOULD |
| 🗺️ Carte | Voir où sont les jeunes aide à choisir. | La carte rend la proximité plus concrète que la liste. | Affichage des résultats de recherche sur une carte du quartier, en plus de la liste. | Cible | SHOULD |
| 📋 Suivi des services | Il faut garder une trace des services passés et à venir. | Un historique donne envie de refaire appel au même jeune. | Rendez-vous terminés ou annulés, historique, possibilité de redemander au même jeune. | Cible | SHOULD |
| ⭐ Confiance et avis | Les familles veulent être rassurées avant de faire entrer quelqu'un chez un proche. | Des avis après service augmentent la confiance. | Charte d'entraide à accepter, avis court après le service, profil enrichi du jeune. | Cible | COULD |
| 📸 Photos et vocal | Demande des clients : pouvoir montrer ou dire le besoin plutôt que l'écrire. | Une photo ou un message vocal est plus simple pour une personne âgée. | Photo de profil, photo dans une demande (ex. l'objet à réparer), message vocal dans la messagerie. | Cible | COULD |
| 🤖 Annonce assistée par IA | Demande des clients : certains jeunes ne savent pas quoi écrire. | Une présentation proposée par l'IA donne des annonces plus complètes. | Le jeune écrit quelques mots, l'IA propose une présentation qu'il peut modifier avant de publier. | Cible | COULD |
| 🌤️ Infos locales | Demande des clients : avoir des infos utiles sur le quartier. | Des infos pratiques aident à préparer le service. | Météo du jour du rendez-vous, lieux utiles proches (supermarché, pharmacie), nom du quartier. | Cible | COULD |
| 📰 Fil du quartier | On veut découvrir les jeunes du quartier sans faire une recherche précise. | Un fil avec des photos et des présentations donne envie de demander de l'aide. | Fil des annonces des jeunes proches, filtrable par service, avec un accès direct au profil et à la messagerie. | Cible | COULD |
| ❤️ Favoris et préférences | On aime retrouver un jeune avec qui ça s'est bien passé. | Les favoris favorisent les services réguliers. | Jeunes favoris, services préférés et rayon de recherche enregistrés. | Cible | COULD |

## User stories (scénario minimal)

### US01 - 🔐 Inscription (Accès, MUST)

**User story :** En tant qu'utilisateur, je veux créer mon compte afin d'accéder à l'app.

**Spécifications fonctionnelles :** Après le choix du rôle, je remplis prénom, nom, e-mail et téléphone, puis je reçois un lien de connexion.

**Critères d'acceptation :** Compte non créé si un champ manque. E-mail au mauvais format refusé. Message si l'e-mail a déjà un compte.

**Spécifications techniques :** POST /users

**Exclusions :** Pas de mot de passe, pas de connexion Google.

### US02 - 🔐 Connexion (Accès, MUST)

**User story :** En tant qu'utilisateur, je veux me connecter avec un lien reçu par e-mail afin de ne pas retenir de mot de passe.

**Spécifications fonctionnelles :** Je saisis mon e-mail, je clique sur le lien reçu et j'arrive sur l'accueil.

**Critères d'acceptation :** Lien envoyé si le compte existe. Message « aucun compte » sinon. Le lien ouvre l'accueil.

**Spécifications techniques :** POST /auth/lien-connexion

**Exclusions :** Pas de « se souvenir de moi ».

### US03 - 🔐 Déconnexion (Accès, MUST)

**User story :** En tant qu'utilisateur, je veux me déconnecter afin de protéger mon compte sur un appareil partagé.

**Spécifications fonctionnelles :** Depuis mon profil, je clique sur « Se déconnecter ».

**Critères d'acceptation :** Retour à l'écran de bienvenue. Les pages de l'app ne sont plus accessibles sans se reconnecter.

**Spécifications techniques :** POST /auth/deconnexion

**Exclusions :** Pas de déconnexion à distance des autres appareils.

### US04 - 👥 Choix du rôle (Rôles, MUST)

**User story :** En tant qu'utilisateur, je veux choisir mon rôle afin d'avoir un parcours adapté.

**Spécifications fonctionnelles :** Premier écran de l'inscription : trois cartes (personne âgée, proche, jeune).

**Critères d'acceptation :** Impossible de continuer sans rôle. Un seul rôle par compte. Le rôle est visible sur l'accueil.

**Spécifications techniques :** Champ rôle : JEUNE, SENIOR, ACCOMPAGNANT

**Exclusions :** Pas de changement de rôle après l'inscription.

### US05 - 🧓 Ajouter un proche (Proche, MUST)

**User story :** En tant que proche, je veux ajouter le profil de la personne que j'accompagne afin d'organiser ses demandes.

**Spécifications fonctionnelles :** Je saisis le prénom et l'adresse de Madeleine et je coche qu'elle est d'accord.

**Critères d'acceptation :** Prénom et adresse obligatoires. Case d'accord obligatoire.

**Spécifications techniques :** POST /users/{id}/beneficiaires

**Exclusions :** Un seul proche par compte dans le scénario minimal.

### US06 - 📍 Mon adresse (Profil, MUST)

**User story :** En tant qu'utilisateur, je veux renseigner mon adresse afin de trouver de l'aide près de chez moi.

**Spécifications fonctionnelles :** Je saisis adresse, code postal et ville ; l'app calcule ma position.

**Critères d'acceptation :** Champs obligatoires. Message si l'adresse est introuvable. L'adresse exacte n'est jamais montrée aux autres.

**Spécifications techniques :** Géocodage de l'adresse → latitude, longitude

**Exclusions :** Pas de position GPS en temps réel pour l'instant

### US07 - 📍 Modifier mon profil (Profil, MUST)

**User story :** En tant qu'utilisateur, je veux modifier mes informations afin de garder un profil à jour.

**Spécifications fonctionnelles :** Depuis « Mon profil », les champs sont pré-remplis et je clique sur « Enregistrer ».

**Critères d'acceptation :** Changements visibles tout de suite

**Spécifications techniques :** PATCH /users/{id}

**Exclusions :** Pas de suppression de compte dans le scénario minimal.

### US08 - 📢 Publier mon annonce (Annonce, MUST)

**User story :** En tant que jeune, je veux publier une annonce avec mes services et une présentation afin d'être trouvé.

**Spécifications fonctionnelles :** Je choisis un ou plusieurs services, j'écris une courte présentation et je publie.

**Critères d'acceptation :** Au moins un service. Présentation de 180 caractères maximum. L'annonce apparaît dans la recherche.

**Spécifications techniques :** POST /users/{id}/services

**Exclusions :** Pas de photos.

### US09 - 📢 Ajouter mes créneaux (Annonce, MUST)

**User story :** En tant que jeune, je veux ajouter mes créneaux afin qu'on sache quand je peux aider.

**Spécifications fonctionnelles :** Pour chaque créneau, je choisis un jour, une heure de début et une heure de fin.

**Critères d'acceptation :** Au moins un créneau pour publier.

**Spécifications techniques :** POST /users/{id}/disponibilites

**Exclusions :** Pas de calendrier avec des dates précises.

### US10 - 📢 Voir mon annonce (Annonce, MUST)

**User story :** En tant que jeune, je veux voir mon annonce comme les autres la voient afin de vérifier qu'elle est claire.

**Spécifications fonctionnelles :** Depuis mon profil, j'ouvre l'aperçu de mon annonce.

**Critères d'acceptation :** Services, créneaux, présentation et distance affichés comme dans la recherche. Téléphone masqué.

**Spécifications techniques :** GET /users/{id}

**Exclusions :** Pas de statistiques de vues.

### US11 - 🏠 Mon contexte (Accueil, MUST)

**User story :** En tant qu'utilisateur, je veux voir mon rôle et mon quartier afin de comprendre où je suis.

**Spécifications fonctionnelles :** En arrivant sur l'accueil, je vois « Bonjour Camille », mon rôle et mon quartier.

**Critères d'acceptation :** Rôle, ville et quartier visibles. Le quartier se change en un clic.

**Spécifications techniques :** Données du profil connecté

**Exclusions :** Pas de personnalisation des couleurs.

### US12 - 🏠 Pour Camille & Madeleine (Accueil, MUST)

**User story :** En tant que proche, je veux voir le prénom de la personne aidée afin de savoir pour qui j'agis.

**Spécifications fonctionnelles :** Un bloc « Pour Madeleine » est affiché en haut de l'accueil.

**Critères d'acceptation :** Bloc visible seulement pour le rôle proche. Les recherches utilisent l'adresse de Madeleine.

**Spécifications techniques :** GET /users/{id}/beneficiaires

**Exclusions :** Pas de changement rapide entre plusieurs proches.

### US13 - 🏠 Raccourcis (Accueil, MUST)

**User story :** En tant qu'utilisateur, je veux des raccourcis vers les actions principales afin d'aller vite.

**Spécifications fonctionnelles :** Bouton « Voir les jeunes disponibles » (demandeur) ou « Publier mon annonce » (jeune), et barre de navigation en bas.

**Critères d'acceptation :** Barre avec Accueil, Services, Messages et Profil. Chaque bouton mène au bon écran.

**Spécifications techniques :** Front uniquement

**Exclusions :** Pas de menu personnalisable.

### US14 - 🏠 Suggestions (Accueil, MUST)

**User story :** En tant qu'utilisateur, je veux voir des suggestions sur l'accueil afin de ne pas tout chercher moi-même.

**Spécifications fonctionnelles :** Le demandeur voit des jeunes proches ; le jeune voit les demandes reçues.

**Critères d'acceptation :** Suggestions triées par distance. Message si rien n'est disponible.

**Spécifications techniques :** GET /jeunes, GET /demandes-service

**Exclusions :** Pas de recommandations intelligentes.

### US15 - 🔎 Filtrer (Recherche, MUST)

**User story :** En tant que demandeur, je veux filtrer les jeunes par service, distance et disponibilité afin de trouver une aide proche.

**Spécifications fonctionnelles :** Je choisis un service, un rayon et un moment, puis je vois la liste des jeunes.

**Critères d'acceptation :** Liste triée du plus proche au plus éloigné. Message si aucun résultat. Les filtres restent choisis quand je reviens.

**Spécifications techniques :** GET /jeunes

**Exclusions :** Pas de carte dans le scénario minimal, pas de recherche par texte.

### US16 - 🔎 Profil d'un jeune (Recherche, MUST)

**User story :** En tant que demandeur, je veux consulter le profil d'un jeune afin de choisir en confiance.

**Spécifications fonctionnelles :** Je clique sur un jeune dans la liste et je vois son profil.

**Critères d'acceptation :** Prénom, âge, photo, services, distance et créneaux visibles. Téléphone masqué.

**Spécifications techniques :** GET /users/{id}

**Exclusions :** Pas d'avis dans le scénario minimal.

### US17 - 📨 Envoyer une demande (Demande, MUST)

**User story :** En tant que demandeur, je veux envoyer une demande à un jeune sur un de ses créneaux afin qu'il comprenne mon besoin.

**Spécifications fonctionnelles :** Depuis le profil du jeune, je choisis un service, un créneau, j'écris des précisions et j'envoie.

**Critères d'acceptation :** Impossible d'envoyer sans service, créneau et précisions. Pour un proche, Madeleine est pré-remplie. Écran « Demande envoyée ».

**Spécifications techniques :** POST /demandes-service

**Exclusions :** Pas de demande à plusieurs jeunes à la fois.

### US18 - 📨 Annuler ma demande (Demande, MUST)

**User story :** En tant que demandeur, je veux annuler une demande afin de prévenir le jeune si je n'ai plus besoin d'aide.

**Spécifications fonctionnelles :** Dans « Mes services », je clique sur « Annuler » sur une demande en attente.

**Critères d'acceptation :** Annulation possible seulement tant que la demande n'est pas acceptée. Statut « annulée » visible des deux côtés.

**Spécifications techniques :** PATCH /demandes-service/{id} → ANNULEE

**Exclusions :** Pas d'annulation après acceptation.

### US19 - 📨 Demandes reçues (Demande, MUST)

**User story :** En tant que jeune, je veux voir les demandes reçues afin de savoir si je peux aider.

**Spécifications fonctionnelles :** Je vois la liste de mes demandes et j'en ouvre une.

**Critères d'acceptation :** Service, personne aidée, distance, créneau et précisions visibles. Téléphone masqué.

**Spécifications techniques :** GET /demandes-service

**Exclusions :** Pas de tri avancé.

### US20 - ✅ Accepter (Réponse, MUST)

**User story :** En tant que jeune, je veux accepter une demande afin de confirmer que je m'en occupe.

**Spécifications fonctionnelles :** Sur la demande, je clique sur « Accepter la demande ».

**Critères d'acceptation :** Statut « acceptée ». Le rendez-vous est créé. Le demandeur voit le changement.

**Spécifications techniques :** PATCH /demandes-service/{id} → ACCEPTEE

**Exclusions :** Pas de proposition d'un autre créneau.

### US21 - ✅ Refuser (Réponse, MUST)

**User story :** En tant que jeune, je veux refuser une demande afin de ne pas laisser la personne attendre.

**Spécifications fonctionnelles :** Sur la demande, je clique sur « Refuser ».

**Critères d'acceptation :** Statut « refusée » visible par le demandeur, qui peut choisir un autre jeune.

**Spécifications techniques :** PATCH /demandes-service/{id} → REFUSEE

**Exclusions :** Pas de motif de refus obligatoire.

### US22 - ✅ Voir le numéro (Réponse, MUST)

**User story :** En tant que demandeur ou jeune, je veux voir le numéro de l'autre une fois la demande acceptée afin de régler les détails.

**Spécifications fonctionnelles :** Sur la demande acceptée, le numéro apparaît.

**Critères d'acceptation :** Numéro masqué tant que la demande est « envoyée ». Visible des deux côtés après acceptation.

**Spécifications techniques :** GET /rendez-vous/{id}

**Exclusions :** Pas d'appel depuis l'app.

### US23 - ✅ Mes services (Réponse, MUST)

**User story :** En tant qu'utilisateur, je veux voir mes demandes et leur statut afin de savoir où j'en suis.

**Spécifications fonctionnelles :** L'onglet « Services » liste mes demandes envoyées ou reçues.

**Critères d'acceptation :** Chaque demande affiche son statut : envoyée, acceptée, refusée ou annulée.

**Spécifications techniques :** GET /demandes-service

**Exclusions :** Pas d'historique des services terminés

## User stories (scénario cible)

### US24 - 💬 Écrire à un jeune (Messagerie, SHOULD)

**User story :** En tant que demandeur, je veux écrire au jeune avant le rendez-vous afin de régler les détails sans donner mon numéro.

**Spécifications fonctionnelles :** Depuis le profil du jeune, le fil ou une demande, je clique sur « Échanger avec Lucas » et j'écris un message.

**Critères d'acceptation :** Message vide refusé. 500 caractères maximum. Le message apparaît avec l'heure d'envoi. Le numéro reste masqué tant que la demande n'est pas acceptée.

**Spécifications techniques :** POST /messages

**Exclusions :** Pas de pièce jointe, pas de message de groupe.

### US25 - 💬 Mes conversations (Messagerie, SHOULD)

**User story :** En tant qu'utilisateur, je veux retrouver toutes mes conversations afin de reprendre un échange.

**Spécifications fonctionnelles :** L'onglet « Messages » liste mes conversations avec le prénom de la personne et le dernier message.

**Critères d'acceptation :** Conversations triées de la plus récente à la plus ancienne. Message si je n'ai encore aucune conversation. Les nouveaux messages s'affichent sans recharger la page.

**Spécifications techniques :** GET /messages

**Exclusions :** Pas de notification , pas d'indicateur « lu ».

### US26 - 🗺️ Voir les jeunes sur la carte (Carte, SHOULD)

**User story :** En tant que demandeur, je veux voir les jeunes disponibles sur une carte afin de me rendre compte de la distance.

**Spécifications fonctionnelles :** Sur la recherche, je passe de « Liste » à « Carte ». Je vois ma position, le rayon choisi et les jeunes autour.

**Critères d'acceptation :** La carte suit les mêmes filtres que la liste. Le cercle correspond au rayon choisi. Pour un proche, la carte est centrée sur l'adresse de Madeleine.

**Spécifications techniques :** GET /jeunes, carte Leaflet (OpenStreetMap)

**Exclusions :** Pas d'itinéraire

### US27 - 🗺️ Ouvrir un profil depuis la carte (Carte, SHOULD)

**User story :** En tant que demandeur, je veux cliquer sur un jeune de la carte afin de voir son profil.

**Spécifications fonctionnelles :** Je clique sur un point de la carte, je vois le prénom et les services, puis j'ouvre le profil.

**Critères d'acceptation :** Le profil ouvert est bien celui du jeune choisi. Le retour ramène à la carte avec les mêmes filtres.

**Spécifications techniques :** GET /users/{id}

**Exclusions :** Pas de demande envoyée directement depuis la carte.

### US28 - 🗺️ Position approximative (Carte, SHOULD)

**User story :** En tant que jeune, je veux que ma position sur la carte soit approximative afin que mon adresse reste privée.

**Spécifications fonctionnelles :** Le point du jeune est placé à quelques centaines de mètres de son adresse réelle.

**Critères d'acceptation :** L'adresse exacte n'est jamais affichée. Le point reste au même endroit d'une visite à l'autre. La distance affichée reste juste.

**Spécifications techniques :** Front uniquement

**Exclusions :** Pas de réglage de la précision par l'utilisateur.

### US29 - ⭐ Charte d'entraide (Confiance, COULD)

**User story :** En tant qu'utilisateur, je veux lire la charte d'entraide afin de connaître les règles avant un service.

**Spécifications fonctionnelles :** Depuis mon profil, j'ouvre « La charte d'entraide » et je clique sur « J'ai compris ».

**Critères d'acceptation :** La charte est lisible depuis le profil. Elle rappelle le respect, l'accord du proche, l'échange du numéro après acceptation et le pourboire libre.

**Spécifications techniques :** Front uniquement

**Exclusions :** Acceptation obligatoire à l'inscription pas encore en place.

### US30 - 📸 Photo de profil (Photos, COULD)

**User story :** En tant qu'utilisateur, je veux ajouter une photo de profil afin d'être reconnu et de mettre en confiance.

**Spécifications fonctionnelles :** Dans « Modifier mon profil », je choisis une photo et je vois un aperçu.

**Critères d'acceptation :** Seulement des images. Taille limitée, sinon message d'erreur. Sans photo, l'initiale du prénom s'affiche.

**Spécifications techniques :** PATCH /users/{id}

**Exclusions :** Pas de retouche ni de recadrage.

### US31 - 📰 Fil du quartier (Fil, COULD)

**User story :** En tant que demandeur, je veux parcourir les annonces des jeunes du quartier afin de découvrir qui peut m'aider.

**Spécifications fonctionnelles :** Depuis l'accueil, j'ouvre « Le fil » et je vois les jeunes proches avec leur photo, leur présentation et leurs créneaux.

**Critères d'acceptation :** Jeunes à moins de 5 km, du plus proche au plus éloigné. Chaque annonce mène au profil et à la messagerie.

**Spécifications techniques :** GET /jeunes

**Exclusions :** Pas de publication par les demandeurs, pas de commentaires.

### US32 - 📰 Filtrer le fil (Fil, COULD)

**User story :** En tant que demandeur, je veux filtrer le fil par service afin de voir seulement l'aide dont j'ai besoin.

**Spécifications fonctionnelles :** Je touche un service en haut du fil (courses, ménage, bricolage…).

**Critères d'acceptation :** Seuls les jeunes qui proposent ce service restent. « Tous » remet le fil complet.

**Spécifications techniques :** GET /jeunes?service=

**Exclusions :** Pas de filtre par créneau dans le fil.

### US33 - 📋 Service terminé (Suivi, SHOULD)

**User story :** En tant que jeune, je veux indiquer qu'un service a eu lieu afin de clore la demande.

**Spécifications fonctionnelles :** Sur une demande acceptée, après le créneau, je clique sur « Service terminé ».

**Critères d'acceptation :** Bouton visible seulement sur une demande acceptée. Statut « terminée » visible des deux côtés.

**Spécifications techniques :** PATCH /demandes-service/{id} → TERMINEE

**Exclusions :** Pas de validation automatique.

### US34 - 📋 Historique (Suivi, SHOULD)

**User story :** En tant qu'utilisateur, je veux voir mes services passés afin de garder une trace de l'aide reçue ou donnée.

**Spécifications fonctionnelles :** Dans « Services », un onglet « Passés » liste les demandes terminées, refusées ou annulées.

**Critères d'acceptation :** Séparation claire entre services à venir et passés. Date, service et personne visibles.

**Spécifications techniques :** GET /demandes-service?statut=

**Exclusions :** Pas d'export.

### US35 - 📋 Redemander au même jeune (Suivi, SHOULD)

**User story :** En tant que demandeur, je veux refaire une demande au même jeune afin de garder quelqu'un de confiance.

**Spécifications fonctionnelles :** Sur un service terminé, je clique sur « Redemander » et le formulaire s'ouvre avec le même jeune et le même service.

**Critères d'acceptation :** Le jeune et le service sont pré-remplis. Je dois choisir un nouveau créneau.

**Spécifications techniques :** POST /demandes-service

**Exclusions :** Pas de demande automatique.

### US36 - ⭐ Laisser un avis (Confiance, COULD)

**User story :** En tant que demandeur, je veux laisser un avis après le service afin d'aider les autres familles à choisir.

**Spécifications fonctionnelles :** Sur un service terminé, je donne une note de 1 à 5 et un court commentaire.

**Critères d'acceptation :** Un seul avis par service. Avis visible sur le profil du jeune. Commentaire de 200 caractères maximum.

**Spécifications techniques :** POST /avis

**Exclusions :** Pas d'avis du jeune sur le demandeur.

### US37 - ❤️ Jeunes favoris (Favoris, COULD)

**User story :** En tant que demandeur, je veux ajouter un jeune en favori afin de le retrouver facilement.

**Spécifications fonctionnelles :** Sur le fil ou le profil, je touche le cœur. Mes favoris apparaissent dans mon profil.

**Critères d'acceptation :** Le favori est gardé après déconnexion. Un deuxième clic le retire.

**Spécifications techniques :** POST /users/{id}/favoris

**Exclusions :** Le jeune n'est pas prévenu.

### US38 - 📸 Photo dans une demande (Photos, COULD)

**User story :** En tant que demandeur, je veux joindre une photo à ma demande afin de montrer le besoin.

**Spécifications fonctionnelles :** Dans le formulaire de demande, j'ajoute une photo (ex. l'objet à réparer).

**Critères d'acceptation :** Une photo maximum. Visible par le jeune dans le détail de la demande.

**Spécifications techniques :** POST /demandes-service (photo)

**Exclusions :** Pas de vidéo.

### US39 - 📸 Message vocal (Photos et vocal, COULD)

**User story :** En tant que personne âgée, je veux envoyer un message vocal afin de ne pas avoir à écrire.

**Spécifications fonctionnelles :** Dans une conversation, je maintiens le micro, je parle et j'envoie.

**Critères d'acceptation :** 1 minute maximum. Le jeune peut l'écouter dans la conversation.

**Spécifications techniques :** POST /messages (audio)

**Exclusions :** Pas de transcription.

### US40 - 🤖 Annonce assistée (IA, COULD)

**User story :** En tant que jeune, je veux qu'une présentation me soit proposée afin d'écrire une annonce complète facilement.

**Spécifications fonctionnelles :** J'écris quelques mots, je clique sur « Proposer un texte », je modifie la proposition puis je publie.

**Critères d'acceptation :** Le texte proposé respecte les 180 caractères. Je peux le modifier ou le refuser.

**Spécifications techniques :** POST /annonce/suggestion

**Exclusions :** Pas de publication sans validation du jeune.

### US41 - 🌤️ Infos locales (Infos locales, COULD)

**User story :** En tant que jeune, je veux voir la météo et les lieux utiles près du rendez-vous afin de préparer le service.

**Spécifications fonctionnelles :** Sur une demande acceptée, je vois la météo du jour et les commerces proches (supermarché, pharmacie).

**Critères d'acceptation :** Météo du jour du créneau. Lieux à moins de 1 km.

**Spécifications techniques :** API météo, API lieux

**Exclusions :** Pas d'itinéraire.
