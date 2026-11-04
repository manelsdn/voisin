import { JOURS } from "./constantes";

const MOTS = {
    COURSES: ["course", "marche", "supermarche", "colis", "pharmacie", "commission", "provision", "boulangerie", "epicerie"],
    MENAGE: ["menage", "nettoy", "propre", "aspirateur", "poussiere", "vaisselle", "linge", "repass", "laver", "ranger"],
    BRICOLAGE: ["bricol", "repar", "fixer", "etagere", "ampoule", "meuble", "monter", "perceuse", "visser", "robinet", "tableau", "porte"],
    INFORMATIQUE: ["ordinateur", "tablette", "telephone", "portable", "internet", "mail", "appel video", "wifi", "imprimante", "application", "whatsapp", "photo"],
    JARDINAGE: ["jardin", "plante", "fleur", "rosier", "arros", "tondre", "pelouse", "tailler", "haie", "potager", "rempot"],
    CUISINE: ["cuisin", "repas", "recette", "soupe", "gateau", "manger", "plat", "dejeuner", "diner"]
};

const MOMENTS = [
    ["apres-midi", "14:00", "17:00"],
    ["apres midi", "14:00", "17:00"],
    ["matin", "09:00", "12:00"],
    ["midi", "11:30", "13:30"],
    ["soir", "18:00", "20:00"]
];

const normaliser = (texte) => texte.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/['’]/g, " ");

const heure = (h, m) => `${String(Math.min(Number(h), 23)).padStart(2, "0")}:${m ? String(m).padStart(2, "0") : "00"}`;

const plus = (debut, heures) => {
    const [h, m] = debut.split(":").map(Number);
    return heure(Math.min(h + heures, 23), m);
};

const jourDans = (decalage, maintenant) => JOURS[(maintenant.getDay() + 6 + decalage) % 7];

export const servicesDans = (texte) => {
    const t = normaliser(texte || "");
    return Object.entries(MOTS).filter(([, mots]) => mots.some((m) => t.includes(m))).map(([code]) => code);
};

export const analyser = (texte, maintenant = new Date()) => {
    const t = normaliser(texte || "");
    const trouve = {};
    if (!t.trim()) return trouve;

    let meilleur = 0;
    Object.entries(MOTS).forEach(([code, mots]) => {
        const score = mots.filter((m) => t.includes(m)).length;
        if (score > meilleur) {
            meilleur = score;
            trouve.service = code;
        }
    });

    const jour = JOURS.find((j) => new RegExp(`\\b${j.toLowerCase()}\\b`).test(t));
    if (jour) trouve.jour = jour;
    else if (/apres[- ]demain/.test(t)) trouve.jour = jourDans(2, maintenant);
    else if (/\bdemain\b/.test(t)) trouve.jour = jourDans(1, maintenant);
    else if (/aujourd hui|ce jour/.test(t)) trouve.jour = jourDans(0, maintenant);
    else if (/week-?end/.test(t)) trouve.jour = "SAMEDI";

    const heures = [...t.matchAll(/\b(\d{1,2})\s*(?:h|heures?)\s*(\d{2})?\b/g)].filter((m) => Number(m[1]) >= 7 && Number(m[1]) <= 21).map((m) => heure(m[1], m[2]));
    if (heures.length >= 2 && heures[1] > heures[0]) {
        trouve.heureDebut = heures[0];
        trouve.heureFin = heures[1];
    } else if (heures.length >= 1) {
        trouve.heureDebut = heures[0];
        trouve.heureFin = plus(heures[0], 2);
    } else {
        const moment = MOMENTS.find(([mot]) => t.includes(mot));
        if (moment) {
            trouve.heureDebut = moment[1];
            trouve.heureFin = moment[2];
        }
    }
    return trouve;
};
