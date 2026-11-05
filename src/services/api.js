import * as firebase from "./stockageFirebase";
import * as test from "./stockageTest";
import * as supa from "./stockageSupabase";
import { distanceKm, geocoder, prochaineDate } from "./geo";
import { NOMS_JOURS, SERVICES, nomService, texteCreneau } from "./constantes";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

const s = process.env.REACT_APP_MODE === "test" ? test : process.env.REACT_APP_BACKEND === "supabase" ? supa : firebase;

export const { envoyerLien, estLien, validerLien, deconnecter, ecouterSession } = s;

export const lireUtilisateur = (id) => s.lire("users", id);

export const emailExiste = async (email) => (await s.chercher("users", "email", email.trim().toLowerCase())).length > 0;

export const creerUtilisateur = async (uid, donnees) => {
    const position = await geocoder(donnees);
    const utilisateur = {
        ...donnees,
        email: donnees.email.trim().toLowerCase(),
        ...position,
        services: [],
        disponibilites: [],
        description: "",
        annoncePubliee: false,
        creeAt: new Date().toISOString()
    };
    await s.ecrire("users", uid, utilisateur);
    return utilisateur;
};

export const modifierUtilisateur = async (utilisateur, changements) => {
    const adresseChangee = ["adresse", "codePostal", "ville"].some((c) => changements[c] !== undefined && changements[c] !== utilisateur[c]);
    let donnees = { ...changements };
    try {
        if (changements.email && changements.email.trim().toLowerCase() !== utilisateur.email) {
            const email = changements.email.trim().toLowerCase();
            if (await emailExiste(email)) throw new Error("Cette adresse e-mail est déjà utilisée par un autre compte.");
            donnees.email = email;
        }
        if (adresseChangee) donnees = { ...donnees, ...(await geocoder({ ...utilisateur, ...changements })) };

        if (changements.photoProfil && s.televerserPhoto) {
            donnees.photoProfil = await s.televerserPhoto(utilisateur.id, changements.photoProfil);
        } else if (changements.photoProfil) {
            const imageRef = ref(getStorage(), `utilisateurs/profil/${utilisateur.id}`);
            await uploadBytes(imageRef, changements.photoProfil);
            const imageURL = await getDownloadURL(imageRef);
            donnees.photoProfil = imageURL;
        }
        await s.ecrire("users", utilisateur.id, donnees);
        return donnees;
    }
    catch (e) {
        throw e;
    }
};

export const listerProches = (accompagnantId) => s.chercher("users", "accompagnantId", accompagnantId);

export const ajouterProche = async (accompagnant, proche) => {
    const position = await geocoder(proche);
    return s.ajouter("users", {
        ...proche,
        ...position,
        role: "SENIOR",
        email: null,
        accompagnantId: accompagnant.id,
        creeAt: new Date().toISOString()
    });
};

export const modifierProche = async (accompagnant, proche, donnees) => {
    donnees = { ...donnees, nom: donnees.nom || "" };
    if (!donnees.prenom || !donnees.adresse || !donnees.codePostal || !donnees.ville) throw new Error("Le prénom et l'adresse de votre proche sont obligatoires.");
    if (proche.accompagnantId !== accompagnant.id) throw new Error("Vous ne pouvez modifier que votre proche.");
    const adresseChangee = donnees.adresse !== proche.adresse || donnees.codePostal !== proche.codePostal || donnees.ville !== proche.ville;
    const position = adresseChangee ? await geocoder(donnees) : {};
    await s.ecrire("users", proche.id, { ...donnees, ...position });
};

export const pointDeRecherche = async (utilisateur) => {
    if (utilisateur.role !== "ACCOMPAGNANT") return { personne: utilisateur, position: utilisateur };
    const proche = (await listerProches(utilisateur.id))[0];
    return { personne: proche || utilisateur, position: proche || utilisateur };
};

export const publierAnnonce = async (jeune, { services, disponibilites, description }) => {
    if (!services.length) throw new Error("Choisissez au moins un service.");
    if (!disponibilites.length) throw new Error("Ajoutez au moins un créneau.");
    if (description.length > 180) throw new Error("La présentation fait 180 caractères maximum.");
    await s.ecrire("users", jeune.id, { services, disponibilites, description, annoncePubliee: true });
};

export const rechercherJeunes = async (position, { service = "", rayon = 2, jour = "" } = {}) => {
    const jeunes = await s.chercher("users", "role", "JEUNE");
    return jeunes
        .filter((j) => j.annoncePubliee)
        .map((j) => ({ ...j, distance: distanceKm(position, j) }))
        .filter((j) => !service || (j.services || []).includes(service))
        .filter((j) => !jour || (j.disponibilites || []).some((d) => d.jour === jour))
        .filter((j) => j.distance !== null && j.distance <= rayon)
        .sort((a, b) => a.distance - b.distance);
};

const prevenir = (de, a, texte, demandeId, type) =>
    s.ajouter("messages", { de: de.id, dePrenom: de.prenom, a: a.id, aPrenom: a.prenom, texte, evenement: { type, demandeId }, creeAt: new Date().toISOString() }).catch(() => null);

export const envoyerDemande = async ({ demandeur, beneficiaire, jeune, service, creneau, description, photo }) => {
    if (!service || !creneau || !description.trim()) throw new Error("Choisissez un service, un créneau et écrivez quelques précisions.");
    const id = await s.ajouter("demandes", {
        demandeurId: demandeur.id,
        demandeurPrenom: demandeur.prenom,
        beneficiaireId: beneficiaire.id,
        beneficiairePrenom: beneficiaire.prenom,
        jeuneId: jeune.id,
        jeunePrenom: jeune.prenom,
        service,
        disponibiliteId: creneau.id,
        creneau: { jour: creneau.jour, heureDebut: creneau.heureDebut, heureFin: creneau.heureFin },
        dateSouhaitee: prochaineDate(creneau.jour),
        description: description.trim(),
        distanceKm: distanceKm(beneficiaire, jeune),
        statut: "ENVOYEE",
        ...(photo ? { photo } : {}),
        creeAt: new Date().toISOString()
    });
    const pour = beneficiaire.id !== demandeur.id ? ` pour ${beneficiaire.prenom}` : "";
    await prevenir(demandeur, jeune, `📩 Nouvelle demande${pour} : ${nomService(service)}, ${texteCreneau(creneau)}. Ouvrez-la pour répondre.`, id, "DEMANDE_RECUE");
    return id;
};

export const lireDemande = (id) => s.lire("demandes", id);

export const mesDemandes = async (utilisateur) => {
    const champ = utilisateur.role === "JEUNE" ? "jeuneId" : "demandeurId";
    const liste = await s.chercher("demandes", champ, utilisateur.id);
    return liste.sort((a, b) => (b.creeAt || "").localeCompare(a.creeAt || ""));
};

export const repondreDemande = async (demande, utilisateur, statut) => {
    if (demande.statut !== "ENVOYEE") throw new Error("Cette demande a déjà une réponse.");
    const estJeune = utilisateur.id === demande.jeuneId;
    if ((statut === "ACCEPTEE" || statut === "REFUSEE") && !estJeune) throw new Error("Seul le jeune peut répondre.");
    if (statut === "ANNULEE" && utilisateur.id !== demande.demandeurId) throw new Error("Seul le demandeur peut annuler.");
    await s.ecrire("demandes", demande.id, { statut, reponduAt: new Date().toISOString() });
    const autre = { id: estJeune ? demande.demandeurId : demande.jeuneId, prenom: estJeune ? demande.demandeurPrenom : demande.jeunePrenom };
    const textes = {
        ACCEPTEE: `✅ ${utilisateur.prenom} a accepté votre demande (${nomService(demande.service)}). Son numéro est maintenant visible.`,
        REFUSEE: `${utilisateur.prenom} n'est pas disponible pour cette demande (${nomService(demande.service)}). Vous pouvez demander à un autre jeune.`,
        ANNULEE: `${utilisateur.prenom} a annulé sa demande (${nomService(demande.service)}).`
    };
    await prevenir(utilisateur, autre, textes[statut], demande.id, `DEMANDE_${statut}`);
    if (statut === "ACCEPTEE") {
        const demandeur = await lireUtilisateur(demande.demandeurId);
        await s.ecrire("rendezVous", demande.id, {
            demandeServiceId: demande.id,
            jeuneId: demande.jeuneId,
            demandeurId: demande.demandeurId,
            beneficiaireId: demande.beneficiaireId,
            service: demande.service,
            date: demande.dateSouhaitee,
            heureDebut: demande.creneau.heureDebut,
            heureFin: demande.creneau.heureFin,
            statut: "CONFIRME",
            telephoneJeune: utilisateur.telephone || "",
            telephoneDemandeur: (demandeur && demandeur.telephone) || "",
            creeAt: new Date().toISOString()
        });
    }
};

export const lireRendezVous = (demandeId) => s.lire("rendezVous", demandeId);

export const envoyerMessage = async (de, a, texte) => {
    const propre = texte.trim();
    if (!propre) throw new Error("Écrivez un message avant d'envoyer.");
    if (propre.length > 500) throw new Error("Le message fait 500 caractères maximum.");
    return s.ajouter("messages", { de: de.id, dePrenom: de.prenom, a: a.id, aPrenom: a.prenom, texte: propre, creeAt: new Date().toISOString() });
};

const mesMessages = async (moi) => {
    const [envoyes, recus] = await Promise.all([s.chercher("messages", "de", moi.id), s.chercher("messages", "a", moi.id)]);
    return [...envoyes, ...recus].sort((x, y) => (x.creeAt || "").localeCompare(y.creeAt || ""));
};

export const lireConversation = async (moi, autreId) =>
    (await mesMessages(moi)).filter((m) => (m.de === moi.id && m.a === autreId) || (m.a === moi.id && m.de === autreId));

export const mesConversations = async (moi) => {
    const parPersonne = {};
    (await mesMessages(moi)).forEach((m) => {
        const autreId = m.de === moi.id ? m.a : m.de;
        const avant = parPersonne[autreId];
        const nonLus = (avant ? avant.nonLus : 0) + (m.a === moi.id && !m.lu ? 1 : 0);
        parPersonne[autreId] = { id: autreId, prenom: m.de === moi.id ? m.aPrenom : m.dePrenom, dernier: m, nonLus };
    });
    return Object.values(parPersonne).sort((x, y) => (y.dernier.creeAt || "").localeCompare(x.dernier.creeAt || ""));
};

export const messagesRecus = (moi) => s.chercher("messages", "a", moi.id);

export const nombreNonLus = async (moi) => (await s.chercher("messages", "a", moi.id)).filter((m) => !m.lu).length;

export const marquerLus = (moi, autreId) => (s.marquerLus ? s.marquerLus(moi.id, autreId) : Promise.resolve());

export const ecouterMessages = (moi, rappel) => {
    if (s.ecouterMessages) return s.ecouterMessages(moi.id, rappel);
    const minuterie = setInterval(() => rappel(null), 4000);
    return () => clearInterval(minuterie);
};

export const membresDuQuartier = async (moi) => {
    const { position } = await pointDeRecherche(moi);
    return (await s.chercher("users", "role", "JEUNE"))
        .filter((j) => j.id !== moi.id)
        .map((j) => ({ ...j, distance: distanceKm(position, j) }))
        .sort((a, b) => (a.distance === null ? 1 : b.distance === null ? -1 : a.distance - b.distance));
};

const televerser = async (chemin, fichier) => {
    if (s.televerser) return s.televerser(chemin, fichier);
    const fichierRef = ref(getStorage(), chemin);
    await uploadBytes(fichierRef, fichier);
    return getDownloadURL(fichierRef);
};

export const televerserPhotoDemande = (utilisateur, fichier) => {
    if (!fichier.type.startsWith("image/")) throw new Error("Choisissez une image.");
    if (fichier.size > 1024 * 1024) throw new Error("La photo fait 1 Mo maximum.");
    return televerser(`demandes/${utilisateur.id}/${Date.now()}`, fichier);
};

export const terminerDemande = async (demande, utilisateur) => {
    if (demande.statut !== "ACCEPTEE") throw new Error("Seule une demande acceptée peut être terminée.");
    if (utilisateur.id !== demande.jeuneId) throw new Error("Seul le jeune peut indiquer que le service a eu lieu.");
    await s.ecrire("demandes", demande.id, { statut: "TERMINEE", termineAt: new Date().toISOString() });
};

export const lireAvis = (demandeId) => s.lire("avis", demandeId);

export const laisserAvis = async (demande, utilisateur, { note, commentaire }) => {
    if (demande.statut !== "TERMINEE") throw new Error("L'avis se donne une fois le service terminé.");
    if (utilisateur.id !== demande.demandeurId) throw new Error("Seul le demandeur peut laisser un avis.");
    const valeur = Number(note);
    if (!(valeur >= 1 && valeur <= 5)) throw new Error("Choisissez une note de 1 à 5.");
    const texte = (commentaire || "").trim();
    if (texte.length > 200) throw new Error("Le commentaire fait 200 caractères maximum.");
    if (await lireAvis(demande.id)) throw new Error("Vous avez déjà laissé un avis pour ce service.");
    await s.ecrire("avis", demande.id, {
        demandeId: demande.id,
        jeuneId: demande.jeuneId,
        auteurId: utilisateur.id,
        auteurPrenom: utilisateur.prenom,
        service: demande.service,
        note: valeur,
        commentaire: texte,
        creeAt: new Date().toISOString()
    });
};

export const avisDuJeune = async (jeuneId) =>
    (await s.chercher("avis", "jeuneId", jeuneId)).sort((a, b) => (b.creeAt || "").localeCompare(a.creeAt || ""));

export const mesFavoris = async (utilisateur) => ((await lireUtilisateur(utilisateur.id)) || {}).favoris || [];

export const basculerFavori = async (utilisateur, jeuneId) => {
    const actuels = await mesFavoris(utilisateur);
    const aime = !actuels.includes(jeuneId);
    const favoris = aime ? [...actuels, jeuneId] : actuels.filter((x) => x !== jeuneId);
    await s.ecrire("users", utilisateur.id, { favoris });
    await s.ecrire("likes", `${jeuneId}_${utilisateur.id}`, { jeuneId, userId: utilisateur.id, prenom: utilisateur.prenom, actif: aime, creeAt: new Date().toISOString() }).catch(() => {});
    return favoris;
};

export const tousLesLikes = async () => {
    const parJeune = {};
    (await s.chercher("likes", "actif", true).catch(() => [])).forEach((l) => {
        parJeune[l.jeuneId] = (parJeune[l.jeuneId] || 0) + 1;
    });
    return parJeune;
};

export const likesDuJeune = async (jeuneId) => (await s.chercher("likes", "jeuneId", jeuneId).catch(() => [])).filter((l) => l.actif);

export const commentairesDuJeune = async (jeuneId) =>
    (await s.chercher("commentaires", "jeuneId", jeuneId).catch(() => [])).sort((a, b) => (a.creeAt < b.creeAt ? -1 : 1));

export const tousLesCommentaires = async (ids) => {
    const listes = await Promise.all(ids.map((id) => commentairesDuJeune(id)));
    return Object.fromEntries(ids.map((id, i) => [id, listes[i]]));
};

const texteCommentaire = (texte) => {
    const t = (texte || "").trim();
    if (!t) throw new Error("Écrivez un petit mot avant de publier.");
    if (t.length > 300) throw new Error("Le commentaire fait 300 caractères maximum.");
    return t;
};

export const commenter = async (auteur, jeuneId, texte) =>
    s.ajouter("commentaires", { jeuneId, auteurId: auteur.id, auteurPrenom: auteur.prenom, auteurPhoto: auteur.photoProfil || null, texte: texteCommentaire(texte), creeAt: new Date().toISOString() });

export const modifierCommentaire = async (auteur, commentaire, texte) => {
    if (commentaire.auteurId !== auteur.id) throw new Error("Vous ne pouvez modifier que vos commentaires.");
    await s.ecrire("commentaires", commentaire.id, { texte: texteCommentaire(texte), modifieAt: new Date().toISOString() });
};

export const supprimerCommentaire = async (auteur, commentaire) => {
    if (commentaire.auteurId !== auteur.id) throw new Error("Vous ne pouvez supprimer que vos commentaires.");
    await s.supprimer("commentaires", commentaire.id);
};

export const supprimerCompte = (utilisateur) => s.supprimerCompte(utilisateur.id);

const TAILLE_MAX = 10 * 1024 * 1024;

export const envoyerFichier = async (de, a, fichier, texte = "") => {
    if (!fichier || !fichier.size) throw new Error("Le fichier est vide.");
    if (fichier.size > TAILLE_MAX) throw new Error("Le fichier fait 10 Mo maximum.");
    const propre = (texte || "").trim().slice(0, 500);
    const nomPropre = (fichier.name || "fichier").replace(/[^\w.-]+/g, "_").slice(-80);
    const url = await televerser(`messages/${de.id}/${Date.now()}-${nomPropre}`, fichier);
    return s.ajouter("messages", {
        de: de.id, dePrenom: de.prenom, a: a.id, aPrenom: a.prenom, texte: propre,
        fichier: { url, nom: fichier.name || "fichier", type: fichier.type || "application/octet-stream", taille: fichier.size },
        creeAt: new Date().toISOString()
    });
};

export const envoyerMessageVocal = async (de, a, enregistrement, duree) => {
    if (!enregistrement || !enregistrement.size) throw new Error("Le message vocal est vide.");
    if (duree > 61) throw new Error("Le message vocal dure 1 minute maximum.");
    const audio = await televerser(`messages/${de.id}/${Date.now()}`, enregistrement);
    return s.ajouter("messages", { de: de.id, dePrenom: de.prenom, a: a.id, aPrenom: a.prenom, texte: "", audio, dureeAudio: Math.round(duree), creeAt: new Date().toISOString() });
};

const couper = (texte, max) => {
    if (texte.length <= max) return texte;
    const court = texte.slice(0, max - 1);
    return court.slice(0, court.lastIndexOf(" ")).replace(/[,;:]$/, "") + ".";
};

const liste = (mots) => (mots.length > 1 ? `${mots.slice(0, -1).join(", ")} et ${mots[mots.length - 1]}` : mots[0] || "");

const MODELES = [
    ({ prenom, mots, services, jours }) => `Bonjour, je suis ${prenom}${mots ? `, ${mots}` : ""}. Je vous aide pour ${services}${jours ? `, le ${jours}` : ""}. À l'heure et avec le sourire !`,
    ({ prenom, mots, services, jours }) => `${prenom}${mots ? `, ${mots}` : ""}. Disponible${jours ? ` le ${jours}` : ""} pour ${services} dans le quartier. N'hésitez pas à m'écrire !`,
    ({ prenom, mots, services }) => `Coup de main de voisin : ${services}. Moi c'est ${prenom}${mots ? `, ${mots}` : ""}. On s'organise ensemble, à votre rythme.`
];

export const suggestionAnnonce = ({ prenom, mots, services, disponibilites }, essai = 0) => {
    if (!services.length) throw new Error("Choisissez au moins un service pour recevoir une proposition.");
    const noms = services.map((c) => (SERVICES.find((x) => x.code === c) || { nom: c }).nom.toLowerCase());
    const jours = [...new Set(disponibilites.map((d) => (NOMS_JOURS[d.jour] || "").toLowerCase()))].filter(Boolean);
    const modele = MODELES[essai % MODELES.length];
    const propre = (mots || "").trim().replace(/[.!]+$/, "");
    return couper(modele({ prenom, mots: propre.charAt(0).toLowerCase() + propre.slice(1), services: liste(noms), jours: liste(jours) }), 180);
};

const METEO = [
    [[0], "Ciel dégagé"], [[1, 2], "Quelques nuages"], [[3], "Couvert"], [[45, 48], "Brouillard"],
    [[51, 53, 55, 56, 57], "Bruine"], [[61, 63, 65, 66, 67, 80, 81, 82], "Pluie"], [[71, 73, 75, 77, 85, 86], "Neige"], [[95, 96, 99], "Orage"]
];

const texteMeteo = (code) => (METEO.find(([codes]) => codes.includes(code)) || [null, "Temps variable"])[1];

export const meteoDuJour = async (position, date) => {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${position.latitude}&longitude=${position.longitude}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Europe%2FParis&start_date=${date}&end_date=${date}`;
    const reponse = await fetch(url);
    if (!reponse.ok) return null;
    const { daily } = await reponse.json();
    if (!daily || !daily.time || !daily.time.length) return null;
    return { texte: texteMeteo(daily.weather_code[0]), min: Math.round(daily.temperature_2m_min[0]), max: Math.round(daily.temperature_2m_max[0]), pluie: daily.precipitation_probability_max[0] };
};

const TYPES_LIEUX = { supermarket: "Supermarché", convenience: "Épicerie", bakery: "Boulangerie", pharmacy: "Pharmacie" };

export const lieuxUtiles = async (position) => {
    const { latitude: la, longitude: lo } = position;
    const requete = `[out:json][timeout:15];(nwr(around:1000,${la},${lo})["shop"~"^(supermarket|convenience|bakery)$"]["name"];nwr(around:1000,${la},${lo})["amenity"="pharmacy"]["name"];);out center 40;`;
    const reponse = await fetch("https://overpass-api.de/api/interpreter", { method: "POST", body: new URLSearchParams({ data: requete }) });
    if (!reponse.ok) return [];
    const { elements = [] } = await reponse.json();
    return elements
        .map((e) => ({
            id: `${e.type}${e.id}`,
            nom: e.tags.name,
            type: TYPES_LIEUX[e.tags.shop || e.tags.amenity] || "Commerce",
            distance: distanceKm(position, { latitude: e.lat != null ? e.lat : e.center && e.center.lat, longitude: e.lon != null ? e.lon : e.center && e.center.lon })
        }))
        .filter((l) => l.distance !== null && l.distance <= 1)
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 6);
};

export const infosLocales = async (demande) => {
    const lieu = await lireUtilisateur(demande.beneficiaireId);
    if (!lieu || lieu.latitude == null) return null;
    const [meteo, lieux] = await Promise.all([meteoDuJour(lieu, demande.dateSouhaitee).catch(() => null), lieuxUtiles(lieu).catch(() => [])]);
    return { meteo, lieux };
};

export const changerRole = async (utilisateur, role) => {
    if (!["JEUNE", "SENIOR", "ACCOMPAGNANT"].includes(role)) throw new Error("Choisissez un rôle.");
    if (role === utilisateur.role) throw new Error("C'est déjà votre rôle.");
    const [recues, envoyees] = await Promise.all([s.chercher("demandes", "jeuneId", utilisateur.id), s.chercher("demandes", "demandeurId", utilisateur.id)]);
    if ([...recues, ...envoyees].some((d) => d.statut === "ENVOYEE" || d.statut === "ACCEPTEE")) {
        throw new Error("Vous avez un service en cours. Terminez-le ou annulez-le avant de changer de rôle.");
    }
    const changements = { role, roleChangeAt: new Date().toISOString() };
    if (utilisateur.role === "JEUNE") changements.annoncePubliee = false;
    await s.ecrire("users", utilisateur.id, changements);
};

const arrondi = (x) => (x == null ? null : Math.round(x * 1000) / 1000);

export const publierBesoin = async (utilisateur, { service, jour, heureDebut, heureFin, description }) => {
    if (!service) throw new Error("Choisissez le service dont vous avez besoin.");
    const texte = (description || "").trim();
    if (!texte) throw new Error("Décrivez votre besoin en quelques mots.");
    if (texte.length > 300) throw new Error("La description fait 300 caractères maximum.");
    if (jour && heureDebut && heureFin && heureFin <= heureDebut) throw new Error("L'heure de fin doit être après l'heure de début.");
    const { personne } = await pointDeRecherche(utilisateur);
    return s.ajouter("besoins", {
        auteurId: utilisateur.id,
        auteurPrenom: utilisateur.prenom,
        beneficiaireId: personne.id,
        beneficiairePrenom: personne.prenom,
        beneficiairePhoto: personne.photoProfil || "",
        ville: personne.ville || "",
        latitude: arrondi(personne.latitude),
        longitude: arrondi(personne.longitude),
        service,
        creneau: jour ? { jour, heureDebut: heureDebut || "", heureFin: heureFin || "" } : null,
        description: texte,
        statut: "OUVERTE",
        creeAt: new Date().toISOString()
    });
};

export const lireBesoin = (id) => s.lire("besoins", id);

export const besoinsProches = async (position, { service = "", rayon = 2 } = {}) =>
    (await s.chercher("besoins", "statut", "OUVERTE"))
        .map((b) => ({ ...b, distance: distanceKm(position, b) }))
        .filter((b) => !service || b.service === service)
        .filter((b) => b.distance !== null && b.distance <= rayon)
        .sort((a, b) => a.distance - b.distance);

export const mesBesoins = async (utilisateur) =>
    (await s.chercher("besoins", "auteurId", utilisateur.id)).sort((a, b) => (b.creeAt || "").localeCompare(a.creeAt || ""));

export const propositionsDuBesoin = async (besoinId) =>
    (await s.chercher("propositions", "besoinId", besoinId)).sort((a, b) => (a.creeAt || "").localeCompare(b.creeAt || ""));

export const maProposition = (besoinId, jeuneId) => s.lire("propositions", `${besoinId}_${jeuneId}`);

export const proposerAide = async (besoin, jeune, message) => {
    if (jeune.role !== "JEUNE") throw new Error("Seuls les jeunes volontaires peuvent proposer leur aide.");
    if (besoin.statut !== "OUVERTE") throw new Error("Cette annonce n'est plus ouverte.");
    if (await maProposition(besoin.id, jeune.id)) throw new Error("Vous avez déjà proposé votre aide.");
    const texte = (message || "").trim() || `Bonjour, je peux vous aider pour ${nomServiceTexte(besoin.service)}.`;
    if (texte.length > 300) throw new Error("Le message fait 300 caractères maximum.");
    await s.ecrire("propositions", `${besoin.id}_${jeune.id}`, {
        besoinId: besoin.id,
        auteurId: besoin.auteurId,
        jeuneId: jeune.id,
        jeunePrenom: jeune.prenom,
        jeunePhoto: jeune.photoProfil || "",
        message: texte,
        creeAt: new Date().toISOString()
    });
    await envoyerMessage(jeune, { id: besoin.auteurId, prenom: besoin.auteurPrenom }, `${texte} (annonce : ${nomServiceTexte(besoin.service)})`);
};

export const changerStatutBesoin = async (besoin, utilisateur, statut, jeuneId) => {
    if (besoin.auteurId !== utilisateur.id) throw new Error("Seul l'auteur peut modifier cette annonce.");
    await s.ecrire("besoins", besoin.id, { statut, ...(jeuneId ? { jeuneId } : {}), modifieAt: new Date().toISOString() });
};

const nomServiceTexte = (code) => ((SERVICES.find((x) => x.code === code) || { nom: code }).nom || "").toLowerCase();
