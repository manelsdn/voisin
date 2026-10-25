export const SERVICES = [
    { code: "COURSES", nom: "Courses", description: "Faire les courses ou récupérer un colis.", image: "/assets/services/courses.jpg" },
    { code: "MENAGE", nom: "Ménage", description: "Un coup de propre léger et régulier.", image: "/assets/services/menage.jpg" },
    { code: "BRICOLAGE", nom: "Bricolage", description: "Petites réparations et objets à fixer.", image: "/assets/services/bricolage.jpg" },
    { code: "INFORMATIQUE", nom: "Informatique", description: "Téléphone, tablette et ordinateur expliqués simplement.", image: "/assets/services/informatique.jpg" },
    { code: "JARDINAGE", nom: "Jardinage", description: "Arroser, tailler, désherber un petit coin de verdure.", image: "/assets/services/jardinage.jpg" },
    { code: "CUISINE", nom: "Cuisine", description: "Préparer un repas ou cuisiner à plusieurs.", image: "/assets/services/cuisine.jpg" }
];

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
    ANNULEE: "Annulée"
};

export const RAYONS = [0.5, 1, 2, 5];

export const imageService = (code) => (SERVICES.find((s) => s.code === code) || {}).image || "";

export const nomService = (code) => (SERVICES.find((s) => s.code === code) || { nom: code }).nom;

export const texteCreneau = (c) => c ? `${NOMS_JOURS[c.jour]} ${c.heureDebut}-${c.heureFin}` : "";

export const texteDistance = (km) => km === null || km === undefined ? "" : km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1).replace(".", ",")} km`;
