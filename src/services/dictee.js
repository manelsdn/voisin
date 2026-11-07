import { JOURS, NOMS_JOURS } from "./constantes";

const LEXIQUE = {
    COURSES: {
        phrases: ["faire mes courses", "faire les courses", "porter mes sacs", "porter les sacs", "porter mes courses", "aller au marche", "au marche", "du marche", "le marche", "aller a la pharmacie", "chercher mes medicaments", "chercher le pain", "recuperer un colis", "aller a la poste"],
        racines: ["course", "commission", "supermarche", "hypermarche", "colis", "pharmacie", "medicament", "ordonnance", "provision", "boulangerie", "epicerie", "carrefour", "monoprix", "franprix", "intermarche", "auchan", "leclerc", "lidl", "casino"],
        mots: ["pain", "sacs", "poste"]
    },
    MENAGE: {
        phrases: ["faire le menage", "passer l aspirateur", "changer les draps", "faire la vaisselle", "laver les vitres", "salle de bain"],
        racines: ["menage", "nettoy", "aspirateur", "poussiere", "serpilliere", "vaisselle", "linge", "repass", "lessive", "vitre", "draps", "rangement", "ranger", "propre", "balayer"],
        mots: ["laver", "sol"]
    },
    BRICOLAGE: {
        phrases: ["changer une ampoule", "monter un meuble", "fixer une etagere", "accrocher un tableau", "une fuite"],
        racines: ["bricol", "repar", "etagere", "ampoule", "meuble", "perceuse", "percer", "visser", "robinet", "tableau", "fuite", "serrure", "rideau", "tringle", "store", "prise", "interrupteur", "demont"],
        mots: ["porte", "portes", "fixer", "monter", "outils"]
    },
    INFORMATIQUE: {
        phrases: ["appel video", "mot de passe", "en ligne", "prendre rendez-vous sur internet"],
        racines: ["ordinateur", "tablette", "telephone", "portable", "smartphone", "internet", "mail", "visio", "wifi", "imprimante", "application", "appli", "whatsapp", "facebook", "zoom", "skype", "doctolib", "ameli", "impots", "informatique", "numerique", "ecran", "clavier", "logiciel", "photos"],
        mots: ["pc", "box", "sms", "photo"]
    },
    JARDINAGE: {
        phrases: ["tondre la pelouse", "tailler la haie", "arroser les plantes", "ramasser les feuilles"],
        racines: ["jardin", "plante", "fleur", "rosier", "arros", "tondre", "tondeuse", "pelouse", "gazon", "tailler", "haie", "potager", "rempot", "balcon", "feuilles", "semis", "terrasse"],
        mots: []
    },
    CUISINE: {
        phrases: ["preparer a manger", "faire a manger", "preparer le repas", "faire un gateau"],
        racines: ["cuisin", "repas", "recette", "soupe", "gateau", "dejeuner", "diner", "plat", "patisserie", "manger"],
        mots: []
    }
};

const MOMENTS = [
    [/fin de matinee/, "10:30", "12:30", "en fin de matinée"],
    [/debut d apres[- ]?midi|apres le dejeuner|apres manger/, "13:30", "15:30", "en début d'après-midi"],
    [/fin d apres[- ]?midi/, "16:00", "18:30", "en fin d'après-midi"],
    [/apres[- ]?midi|aprem/, "14:00", "17:00", "l'après-midi"],
    [/avant midi|matinee|\bmatin\b/, "09:00", "12:00", "le matin"],
    [/\bmidi\b/, "11:30", "13:30", "vers midi"],
    [/\bsoir\b|soiree/, "18:00", "20:00", "le soir"]
];

const URGENT = /\b(maintenant|tout de suite|des que possible|au plus vite|rapidement|urgent|urgence|vite)\b/;

const normaliser = (texte) => String(texte || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/['’]/g, " ").replace(/\s+/g, " ");

const distance = (a, b) => {
    if (Math.abs(a.length - b.length) > 1) return 2;
    const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
    for (let j = 1; j <= b.length; j += 1) d[0][j] = j;
    for (let i = 1; i <= a.length; i += 1) {
        for (let j = 1; j <= b.length; j += 1) {
            d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
        }
    }
    return d[a.length][b.length];
};

const proche = (mot, racine) => {
    if (mot.startsWith(racine)) return 2;
    if (racine.length >= 5 && mot.length >= racine.length - 1 && distance(mot.slice(0, racine.length), racine) <= 1) return 1;
    return 0;
};

const scores = (t) => {
    const mots = t.split(/[^a-z0-9-]+/).filter(Boolean);
    const resultat = {};
    Object.entries(LEXIQUE).forEach(([code, { phrases, racines, mots: exacts }]) => {
        let score = 0;
        phrases.forEach((p) => { if (t.includes(p)) score += 3; });
        mots.forEach((m) => {
            if (exacts.includes(m)) score += 2;
            else score += Math.max(0, ...racines.map((r) => proche(m, r)));
        });
        if (score > 0) resultat[code] = score;
    });
    return resultat;
};

const heure = (h, m) => `${String(Math.min(Number(h), 23)).padStart(2, "0")}:${m ? String(m).padStart(2, "0") : "00"}`;

const ajouter = (debut, minutes) => {
    const [h, m] = debut.split(":").map(Number);
    const total = Math.min(h * 60 + m + minutes, 23 * 60 + 59);
    return heure(Math.floor(total / 60), total % 60);
};

const jourDans = (decalage, maintenant) => JOURS[(maintenant.getDay() + 6 + decalage) % 7];

const heuresDans = (t) => {
    const apresMidi = /apres[- ]?midi|du soir/.test(t);
    return [...t.matchAll(/\b(\d{1,2})\s*(?:h|heures?)\s*(\d{2})?\b/g)]
        .map((m) => {
            let h = Number(m[1]);
            if (apresMidi && h >= 1 && h <= 8) h += 12;
            return { h, m: m[2] };
        })
        .filter(({ h }) => h >= 7 && h <= 21)
        .map(({ h, m }) => heure(h, m));
};

export const servicesDans = (texte) => {
    const s = scores(normaliser(texte));
    return Object.keys(s).filter((code) => s[code] >= 2);
};

export const analyser = (texte, maintenant = new Date()) => {
    const t = normaliser(texte);
    const trouve = {};
    if (!t.trim()) return trouve;

    const s = scores(t);
    const meilleur = Object.entries(s).sort((a, b) => b[1] - a[1])[0];
    if (meilleur) trouve.service = meilleur[0];

    const jour = JOURS.find((j) => new RegExp(`\\b${j.toLowerCase()}s?\\b`).test(t));
    if (jour) trouve.jour = jour;
    else if (/apres[- ]demain/.test(t)) trouve.jour = jourDans(2, maintenant);
    else if (/\bdemain\b/.test(t)) trouve.jour = jourDans(1, maintenant);
    else if (/aujourd hui|ce jour|\bce matin\b|\bcet apres[- ]?midi\b|\bcet aprem\b|\bce midi\b|\bce soir\b/.test(t) || URGENT.test(t)) trouve.jour = jourDans(0, maintenant);
    else if (/week-?end/.test(t)) trouve.jour = "SAMEDI";
    if (trouve.jour && trouve.jour === jourDans(0, maintenant) && !new RegExp(`\\b${trouve.jour.toLowerCase()} prochain`).test(t)) trouve.aujourdhui = true;

    const heures = heuresDans(t);
    if (heures.length >= 2 && heures[1] > heures[0]) {
        trouve.heureDebut = heures[0];
        trouve.heureFin = heures[1];
    } else if (heures.length >= 1) {
        trouve.heureDebut = heures[0];
        trouve.heureFin = ajouter(heures[0], 120);
    } else if (URGENT.test(t) && trouve.aujourdhui) {
        const debut = heure(maintenant.getHours(), maintenant.getMinutes());
        trouve.heureDebut = debut;
        trouve.heureFin = ajouter(debut, 180);
        trouve.moment = "dès que possible";
    } else {
        const moment = MOMENTS.find(([motif]) => motif.test(t));
        if (moment) {
            trouve.heureDebut = moment[1];
            trouve.heureFin = moment[2];
            trouve.moment = moment[3];
        }
    }
    return trouve;
};

export const resumer = (compris) => {
    const quand = compris.jour ? (compris.aujourdhui ? `aujourd'hui (${NOMS_JOURS[compris.jour].toLowerCase()})` : NOMS_JOURS[compris.jour].toLowerCase()) : "";
    const heures = compris.heureDebut ? `${compris.moment ? `${compris.moment}, ` : ""}${compris.heureDebut}-${compris.heureFin}` : "";
    return [quand, heures].filter(Boolean).join(" · ");
};
