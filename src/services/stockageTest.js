const CLE = "vdo-db";
const auditeurs = new Set();

const base = () => {
    const brut = localStorage.getItem(CLE);
    const db = brut ? JSON.parse(brut) : {};
    ["users", "demandes", "rendezVous", "messages", "avis", "besoins", "propositions", "likes", "commentaires"].forEach((c) => { db[c] = db[c] || {}; });
    return db;
};

const sauver = (db) => localStorage.setItem(CLE, JSON.stringify(db));

const signaler = (col) => window.dispatchEvent(new CustomEvent("vdo-change", { detail: col }));

export const lire = async (col, id) => {
    const d = base()[col][id];
    return d ? { id, ...d } : null;
};

export const ecrire = async (col, id, data) => {
    const db = base();
    db[col][id] = { ...(db[col][id] || {}), ...data };
    sauver(db);
    signaler(col);
};

export const supprimer = async (col, id) => {
    const db = base();
    delete db[col][id];
    sauver(db);
    signaler(col);
};

export const ecouterMessages = (moiId, rappel) => {
    const local = (e) => e.detail === "messages" && rappel(null);
    const autreOnglet = (e) => e.key === CLE && rappel(null);
    window.addEventListener("vdo-change", local);
    window.addEventListener("storage", autreOnglet);
    return () => {
        window.removeEventListener("vdo-change", local);
        window.removeEventListener("storage", autreOnglet);
    };
};

export const marquerLus = async (moiId, deId) => {
    const db = base();
    let change = false;
    Object.values(db.messages).forEach((m) => {
        if (m.a === moiId && m.de === deId && !m.lu) {
            m.lu = true;
            change = true;
        }
    });
    if (change) {
        sauver(db);
        signaler("messages");
    }
};

export const ajouter = async (col, data) => {
    const id = col.slice(0, 3) + Date.now() + Math.floor(Math.random() * 1000);
    await ecrire(col, id, data);
    return id;
};

export const chercher = async (col, champ, valeur) =>
    Object.entries(base()[col]).filter(([, d]) => d[champ] === valeur).map(([id, d]) => ({ id, ...d }));

export const televerser = (chemin, fichier) => new Promise((resoudre, rejeter) => {
    const lecteur = new FileReader();
    lecteur.onload = () => resoudre(lecteur.result);
    lecteur.onerror = () => rejeter(new Error("Le fichier n'a pas pu être lu."));
    lecteur.readAsDataURL(fichier);
});

const session = () => localStorage.getItem("vdo-session");
const prevenir = () => auditeurs.forEach((f) => f(session()));

export const envoyerLien = async (email) => {
    localStorage.setItem("vdo-lien", email);
    return { lienTest: `/reussite-inscription?lien=test&email=${encodeURIComponent(email)}` };
};

export const estLien = (href) => href.includes("lien=test");

export const validerLien = async (href, email) => {
    const existant = (await chercher("users", "email", email))[0];
    const uid = existant ? existant.id : "u" + Date.now();
    localStorage.setItem("vdo-session", uid);
    prevenir();
    return uid;
};

export const deconnecter = async () => {
    localStorage.removeItem("vdo-session");
    prevenir();
};

export const supprimerCompte = async (uid) => {
    const db = base();
    const lie = (d) => [d.userId, d.auteurId, d.de, d.a, d.demandeurId, d.beneficiaireId, d.jeuneId].includes(uid);
    delete db.users[uid];
    ["demandes", "rendezVous", "messages", "avis", "besoins", "propositions", "likes", "commentaires"].forEach((c) => {
        Object.keys(db[c]).forEach((id) => { if (lie(db[c][id])) delete db[c][id]; });
    });
    sauver(db);
    await deconnecter();
};

export const ecouterSession = (rappel) => {
    auditeurs.add(rappel);
    rappel(session());
    return () => auditeurs.delete(rappel);
};
