import { JOURS, NOMS_JOURS, texteJour } from "./constantes";

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
        racines: ["ordinateur", "tablette", "telephone", "portable", "smartphone", "internet", "mail", "visio", "wifi", "imprimante", "application", "appli", "whatsapp", "facebook", "zoom", "skype", "doctolib", "ameli", "informatique", "numerique", "ecran", "clavier", "logiciel", "photos"],
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
    },
    COMPAGNIE: {
        phrases: ["tenir compagnie", "un peu de compagnie", "discuter un peu", "jouer aux cartes", "jeux de societe", "prendre un cafe", "je me sens seul", "je me sens seule", "lire le journal", "faire la lecture"],
        racines: ["compagnie", "discut", "bavard", "papot", "convers", "solitude", "scrabble", "belote", "domino", "lecture", "gouter", "visite"],
        mots: ["seul", "seule", "jeux", "jouer", "cartes", "parler", "cafe", "the"]
    },
    SORTIES: {
        phrases: ["faire une promenade", "faire un tour", "aller me promener", "m accompagner", "accompagner chez", "rendez-vous medical", "chez le medecin", "chez le docteur", "a la banque", "a la mairie", "au cinema", "au musee"],
        racines: ["promen", "balade", "accompagn", "sortie", "sortir", "medecin", "docteur", "dentiste", "kine", "hopital", "banque", "mairie", "cinema", "musee", "cimetiere", "eglise", "parc"],
        mots: ["tour"]
    },
    PAPIERS: {
        phrases: ["mes papiers", "un formulaire", "une lettre", "mon courrier", "remplir un dossier", "declaration d impots", "les impots", "demarches administratives"],
        racines: ["papier", "impot", "courrier", "lettre", "formulaire", "administra", "demarche", "dossier", "facture", "retraite", "mutuelle", "assurance", "classer"],
        mots: ["caf", "cpam"]
    },
    ANIMAUX: {
        phrases: ["promener le chien", "promener mon chien", "sortir le chien", "sortir mon chien", "nourrir le chat", "nourrir mon chat", "garder mon chat", "garder mon chien"],
        racines: ["chien", "chat", "animal", "animaux", "veterinaire", "croquette", "litiere", "oiseau", "perruche", "lapin", "poisson"],
        mots: ["toutou", "minou"]
    }
};

const SOUS = {
    COURSES: [["Pharmacie", /pharmac|medicament|ordonnance/], ["Marché", /marche/], ["Boulangerie", /boulang|\bpain\b|croissant/], ["Colis ou poste", /colis|poste|lettre recommandee/], ["Supermarché", /supermarche|hypermarche|carrefour|monoprix|franprix|intermarche|auchan|leclerc|lidl|casino/]],
    MENAGE: [["Vitres", /vitre|fenetre/], ["Salle de bain", /salle de bain|douche|toilettes|wc/], ["Linge et repassage", /linge|repass|lessive|draps/], ["Rangement", /rang/], ["Cuisine", /cuisine|vaisselle/]],
    BRICOLAGE: [["Ampoule", /ampoule|lampe/], ["Meuble à monter", /meuble|monter/], ["Étagère ou tableau", /etagere|tableau|cadre|accroch/], ["Petite fuite", /fuite|robinet/], ["Rideaux", /rideau|tringle|store/]],
    INFORMATIQUE: [["Appel vidéo", /visio|appel video|zoom|skype|whatsapp/], ["Imprimante", /imprim/], ["Tablette", /tablette|ipad/], ["Internet et mails", /internet|mail|wifi|box|doctolib|ameli/], ["Téléphone", /telephone|portable|smartphone|sms/]],
    JARDINAGE: [["Tonte", /tond|pelouse|gazon/], ["Taille", /taill|haie|rosier/], ["Arrosage", /arros/], ["Potager", /potager|legume|semis/], ["Balcon et plantes", /balcon|plante|fleur|rempot/]],
    CUISINE: [["Pâtisserie", /gateau|patisserie|tarte/], ["Plats d'avance", /d avance|pour la semaine|congel/], ["Repas du soir", /soir|diner/], ["Repas du midi", /midi|dejeuner/]],
    COMPAGNIE: [["Jeux de société", /jeu|jouer|cartes|scrabble|belote|domino/], ["Lecture", /lecture|lire|livre|journal/], ["Café ou goûter", /cafe|gouter|\bthe\b/], ["Appel téléphonique", /telephone|appel/], ["Discussion", /discut|parler|bavard|papot|convers|seul/]],
    SORTIES: [["Rendez-vous médical", /medecin|docteur|dentiste|kine|hopital|medical/], ["Banque ou mairie", /banque|mairie|poste/], ["Sortie culturelle", /cinema|musee|theatre|concert|expo/], ["Promenade", /promen|balade|tour|parc/]],
    PAPIERS: [["Impôts", /impot/], ["Formulaire", /formulaire|dossier|caf|cpam|retraite|mutuelle/], ["Rendez-vous en ligne", /rendez-vous en ligne|doctolib|en ligne/], ["Classer les papiers", /classer|ranger/], ["Courrier", /courrier|lettre/]],
    ANIMAUX: [["Promener le chien", /promen|sortir le chien|sortir mon chien|balade/], ["Nourrir le chat", /nourri|croquette|litiere/], ["Vétérinaire", /veterinaire|veto/], ["Garde", /gard|vacances|absent/]]
};

const MOIS = ["janvier", "fevrier", "mars", "avril", "mai", "juin", "juillet", "aout", "septembre", "octobre", "novembre", "decembre"];

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

const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const dansJours = (decalage, maintenant) => {
    const d = new Date(maintenant);
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() + decalage);
    return iso(d);
};

const jourDeDate = (texte) => JOURS[(new Date(`${texte}T12:00:00`).getDay() + 6) % 7];

const ecartJusqua = (jour, maintenant, exclureAujourdhui) => {
    const ecart = (JOURS.indexOf(jour) - ((maintenant.getDay() + 6) % 7) + 7) % 7;
    return ecart === 0 && exclureAujourdhui ? 7 : ecart;
};

const dateDans = (t, maintenant) => {
    const m = t.match(/\b(?:le\s+)?(\d{1,2})(?:\s*(?:er)?\s+(janvier|fevrier|mars|avril|mai|juin|juillet|aout|septembre|octobre|novembre|decembre)|\s*\/\s*(\d{1,2}))/) || t.match(/\ble\s+(\d{1,2})(?:er)?\b(?!\s*(?:h|heures?|km|m\b|min))/);
    if (!m) return "";
    const jour = Number(m[1]);
    const mois = m[2] ? MOIS.indexOf(m[2]) : m[3] ? Number(m[3]) - 1 : null;
    if (jour < 1 || jour > 31 || (mois !== null && (mois < 0 || mois > 11))) return "";
    const aujourdhui = new Date(maintenant);
    aujourdhui.setHours(12, 0, 0, 0);
    let d = new Date(aujourdhui.getFullYear(), mois === null ? aujourdhui.getMonth() : mois, jour, 12);
    if (d < aujourdhui && mois === null) d = new Date(aujourdhui.getFullYear(), aujourdhui.getMonth() + 1, jour, 12);
    else if (d < aujourdhui) d = new Date(aujourdhui.getFullYear() + 1, mois, jour, 12);
    if (d.getDate() !== jour) return "";
    return iso(d);
};

export const sousServiceDans = (service, texte) => {
    const t = normaliser(texte);
    const trouve = (SOUS[service] || []).find(([, motif]) => motif.test(t));
    return trouve ? trouve[0] : "";
};

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

    if (trouve.service) {
        const sous = sousServiceDans(trouve.service, t);
        if (sous) trouve.sous = sous;
    }

    const precise = dateDans(t, maintenant);
    const jour = JOURS.find((j) => new RegExp(`\\b${j.toLowerCase()}s?\\b`).test(t));
    if (precise) {
        trouve.date = precise;
        trouve.jour = jourDeDate(precise);
        if (precise === dansJours(0, maintenant)) trouve.aujourdhui = true;
    } else if (jour) {
        trouve.jour = jour;
        trouve.date = dansJours(ecartJusqua(jour, maintenant, true), maintenant);
    } else if (/apres[- ]demain/.test(t)) {
        trouve.jour = jourDans(2, maintenant);
        trouve.date = dansJours(2, maintenant);
    } else if (/\bdemain\b/.test(t)) {
        trouve.jour = jourDans(1, maintenant);
        trouve.date = dansJours(1, maintenant);
    } else if (/aujourd hui|ce jour|\bce matin\b|\bcet apres[- ]?midi\b|\bcet aprem\b|\bce midi\b|\bce soir\b/.test(t) || URGENT.test(t)) {
        trouve.jour = jourDans(0, maintenant);
        trouve.date = dansJours(0, maintenant);
        trouve.aujourdhui = true;
    } else if (/week-?end/.test(t)) {
        trouve.jour = "SAMEDI";
        trouve.date = dansJours(ecartJusqua("SAMEDI", maintenant, false), maintenant);
    }

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
    const quand = compris.jour ? (compris.aujourdhui ? `aujourd'hui (${NOMS_JOURS[compris.jour].toLowerCase()})` : compris.date ? texteJour(compris.date).toLowerCase() : NOMS_JOURS[compris.jour].toLowerCase()) : "";
    const heures = compris.heureDebut ? `${compris.moment ? `${compris.moment}, ` : ""}${compris.heureDebut}-${compris.heureFin}` : "";
    return [quand, heures].filter(Boolean).join(" · ");
};
