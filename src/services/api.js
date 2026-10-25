import * as firebase from "./stockageFirebase";
import * as test from "./stockageTest";
import * as supa from "./stockageSupabase";
import { distanceKm, geocoder, prochaineDate } from "./geo";
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

export const envoyerDemande = async ({ demandeur, beneficiaire, jeune, service, creneau, description }) => {
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
