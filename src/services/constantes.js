export const SERVICES = [
    { code: "COURSES", nom: "Courses", description: "Faire les courses ou récupérer un colis.", image: "/assets/services/courses.jpg" },
    { code: "MENAGE", nom: "Ménage", description: "Un coup de propre léger et régulier.", image: "/assets/services/menage.jpg" },
    { code: "BRICOLAGE", nom: "Bricolage", description: "Petites réparations et objets à fixer.", image: "/assets/services/bricolage.jpg" },
    { code: "INFORMATIQUE", nom: "Informatique", description: "Téléphone, tablette et ordinateur expliqués simplement.", image: "/assets/services/informatique.jpg" },
    { code: "JARDINAGE", nom: "Jardinage", description: "Arroser, tailler, désherber un petit coin de verdure.", image: "/assets/services/jardinage.jpg" },
    { code: "CUISINE", nom: "Cuisine", description: "Préparer un repas ou cuisiner à plusieurs.", image: "/assets/services/cuisine.jpg" },
    { code: "COMPAGNIE", nom: "Compagnie", description: "Discuter, jouer, lire ou partager un café.", image: "/assets/services/compagnie.jpg", banniere: "/assets/services/plein/compagnie.jpg" },
    { code: "SORTIES", nom: "Sorties", description: "Une promenade ou un accompagnement à un rendez-vous.", image: "/assets/services/sorties.jpg", banniere: "/assets/services/plein/sorties.jpg" },
    { code: "PAPIERS", nom: "Papiers", description: "Courrier, formulaires et démarches administratives.", image: "/assets/services/papiers.jpg", banniere: "/assets/services/plein/papiers.jpg" },
    { code: "ANIMAUX", nom: "Animaux", description: "Promener le chien, nourrir le chat.", image: "/assets/services/animaux.jpg", banniere: "/assets/services/plein/animaux.jpg" }
];

export const SOUS_SERVICES = {
    COURSES: ["Supermarché", "Pharmacie", "Marché", "Boulangerie", "Colis ou poste"],
    MENAGE: ["Cuisine", "Salle de bain", "Vitres", "Linge et repassage", "Rangement"],
    BRICOLAGE: ["Ampoule", "Meuble à monter", "Étagère ou tableau", "Petite fuite", "Rideaux"],
    INFORMATIQUE: ["Téléphone", "Tablette", "Appel vidéo", "Internet et mails", "Imprimante"],
    JARDINAGE: ["Arrosage", "Tonte", "Taille", "Balcon et plantes", "Potager"],
    CUISINE: ["Repas du midi", "Repas du soir", "Pâtisserie", "Plats d'avance"],
    COMPAGNIE: ["Discussion", "Jeux de société", "Lecture", "Café ou goûter", "Appel téléphonique"],
    SORTIES: ["Promenade", "Rendez-vous médical", "Banque ou mairie", "Sortie culturelle"],
    PAPIERS: ["Courrier", "Formulaire", "Impôts", "Rendez-vous en ligne", "Classer les papiers"],
    ANIMAUX: ["Promener le chien", "Nourrir le chat", "Vétérinaire", "Garde"]
};

export const JOURS = ["LUNDI", "MARDI", "MERCREDI", "JEUDI", "VENDREDI", "SAMEDI", "DIMANCHE"];

export const NOMS_JOURS = {
    LUNDI: "Lundi", MARDI: "Mardi", MERCREDI: "Mercredi", JEUDI: "Jeudi",
    VENDREDI: "Vendredi", SAMEDI: "Samedi", DIMANCHE: "Dimanche"
};

export const ROLES = {
    JEUNE: "Jeune volontaire",
    SENIOR: "Personne âgée",
    ACCOMPAGNANT: "Proche accompagnateur"
};

export const STATUTS = {
    ENVOYEE: "Envoyée",
    ACCEPTEE: "Acceptée",
    REFUSEE: "Refusée",
    TERMINEE: "Terminée",
    ANNULEE: "Annulée"
};

export const etatService = (statut, estJeune) => ({
    ENVOYEE: estJeune ? "À vous de répondre" : "En attente",
    ACCEPTEE: "Acceptée",
    TERMINEE: "Terminée",
    REFUSEE: "Refusée",
    ANNULEE: "Annulée"
}[statut] || STATUTS[statut]);

export const RAYONS = [0.5, 1, 2];

export const imageService = (code) => (SERVICES.find((s) => s.code === code) || {}).image || "";

export const nomService = (code) => (SERVICES.find((s) => s.code === code) || { nom: code }).nom;

export const nomComplet = (code, sous) => (sous ? `${nomService(code)} · ${sous}` : nomService(code));

const DATE_COURTE = { weekday: "long", day: "numeric", month: "short" };

export const texteJour = (iso) => {
    if (!iso) return "";
    const texte = new Date(`${iso}T12:00:00`).toLocaleDateString("fr-FR", DATE_COURTE);
    return texte.charAt(0).toUpperCase() + texte.slice(1);
};

export const texteQuand = (creneau, date) => {
    if (!creneau) return date ? texteJour(date) : "";
    if (!date) return texteCreneau(creneau);
    return creneau.heureDebut ? `${texteJour(date)}, ${creneau.heureDebut}-${creneau.heureFin}` : texteJour(date);
};

export const texteCreneau = (c) => c ? `${c.date ? `${texteJour(c.date)},` : NOMS_JOURS[c.jour]} ${c.heureDebut}-${c.heureFin}` : "";

export const aujourdhuiIso = (maintenant = new Date()) => `${maintenant.getFullYear()}-${String(maintenant.getMonth() + 1).padStart(2, "0")}-${String(maintenant.getDate()).padStart(2, "0")}`;

export const creneauxActifs = (liste) => (liste || []).filter((c) => !c.date || c.date >= aujourdhuiIso());

export const texteDistance = (km) => km === null || km === undefined ? "" : km < 0.05 ? "Tout près" : km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1).replace(".", ",")} km`;

export const majuscule = (texte) => String(texte || "").trim().replace(/(^|[\s'-])(\p{L})/gu, (_, avant, lettre) => avant + lettre.toLocaleUpperCase("fr"));

export const ICONES_SERVICES = { COURSES: "bag", MENAGE: "clean", BRICOLAGE: "tool", INFORMATIQUE: "laptop", JARDINAGE: "leaf", CUISINE: "pot", COMPAGNIE: "users", SORTIES: "footprints", PAPIERS: "file-text", ANIMAUX: "paw" };

export const iconeService = (code) => ICONES_SERVICES[code] || "heart";

export const STATUTS_BESOIN = { OUVERTE: "Ouverte", POURVUE: "Pourvue", FERMEE: "Fermée" };

export const depuis = (iso) => {
    if (!iso) return "";
    const minutes = Math.max(1, Math.round((Date.now() - new Date(iso)) / 60000));
    if (minutes < 60) return `il y a ${minutes} min`;
    const heures = Math.round(minutes / 60);
    if (heures < 24) return `il y a ${heures} h`;
    const jours = Math.round(heures / 24);
    return jours === 1 ? "hier" : `il y a ${jours} jours`;
};
