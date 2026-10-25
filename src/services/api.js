import * as firebase from "./stockageFirebase";
import * as test from "./stockageTest";
import * as supa from "./stockageSupabase";
import { distanceKm, geocoder, prochaineDate } from "./geo";
import { NOMS_JOURS, SERVICES } from "./constantes";
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

export const envoyerDemande = async ({ demandeur, beneficiaire, jeune, service, creneau, description, photo }) => {
    if (!service || !creneau || !description.trim()) throw new Error("Choisissez un service, un créneau et écrivez quelques précisions.");
    return s.ajouter("demandes", {
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
        parPersonne[autreId] = { id: autreId, prenom: m.de === moi.id ? m.aPrenom : m.dePrenom, dernier: m };
    });
    return Object.values(parPersonne).sort((x, y) => (y.dernier.creeAt || "").localeCompare(x.dernier.creeAt || ""));
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
    const favoris = actuels.includes(jeuneId) ? actuels.filter((x) => x !== jeuneId) : [...actuels, jeuneId];
    await s.ecrire("users", utilisateur.id, { favoris });
    return favoris;
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
