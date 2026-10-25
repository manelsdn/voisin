import { supabase } from "../configs/supabase";

const lienInitial = typeof window !== "undefined" ? window.location.href : "";

const TABLES = { users: "users", demandes: "demandes", rendezVous: "rendez_vous", messages: "messages", avis: "avis" };
const table = (col) => supabase().from(TABLES[col] || col);
const doc = (ligne) => (ligne ? { id: ligne.id, ...ligne.data } : null);
const nouvelId = () => (window.crypto && window.crypto.randomUUID ? window.crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));

const traduire = (message) => {
    if (/rate limit|too many/i.test(message)) return "Trop d'e-mails envoyés pour le moment. Réessayez dans quelques minutes.";
    if (/expired|link is invalid/i.test(message)) return "Le lien n'est plus valide. Demandez un nouveau lien.";
    return message;
};

const verifier = ({ data, error }) => {
    if (error) throw new Error(traduire(error.message));
    return data;
};

export const lire = async (col, id) => doc(verifier(await table(col).select("id, data").eq("id", id).maybeSingle()));

export const ecrire = async (col, id, data) => {
    const existant = verifier(await table(col).select("id, data").eq("id", id).maybeSingle());
    if (existant) verifier(await table(col).update({ data: { ...existant.data, ...data } }).eq("id", id));
    else verifier(await table(col).insert({ id, data }));
};

export const ajouter = async (col, data) => {
    const id = nouvelId();
    verifier(await table(col).insert({ id, data }));
    return id;
};

export const chercher = async (col, champ, valeur) =>
    verifier(await table(col).select("id, data").eq(`data->>${champ}`, valeur)).map(doc);

export const televerserPhoto = async (uid, fichier) => {
    const chemin = `profil/${uid}`;
    verifier(await supabase().storage.from("photos").upload(chemin, fichier, { upsert: true, contentType: fichier.type }));
    const { data } = supabase().storage.from("photos").getPublicUrl(chemin);
    return `${data.publicUrl}?v=${Date.now()}`;
};

export const televerser = async (chemin, fichier) => {
    verifier(await supabase().storage.from("photos").upload(chemin, fichier, { upsert: true, contentType: (fichier.type || "application/octet-stream").split(";")[0] }));
    return supabase().storage.from("photos").getPublicUrl(chemin).data.publicUrl;
};

const inscriptionLocale = (email) => {
    try {
        const brut = JSON.parse(localStorage.getItem("inscriptionEnCours") || "null");
        return brut && brut.email === email ? brut : null;
    } catch (e) {
        return null;
    }
};

export const envoyerLien = async (email) => {
    const inscription = inscriptionLocale(email);
    verifier(await supabase().auth.signInWithOtp({
        email,
        options: {
            emailRedirectTo: `${window.location.origin}/reussite-inscription?email=${encodeURIComponent(email)}`,
            shouldCreateUser: true,
            data: inscription ? { inscription } : undefined
        }
    }));
    return {};
};

const contientJeton = (href) => /access_token=|[?&]code=|token_hash=/.test(href || "");

export const estLien = (href) => contientJeton(href) || contientJeton(lienInitial);

export const validerLien = async (href) => {
    const adresse = new URL(contientJeton(href) ? href : lienInitial);
    const code = adresse.searchParams.get("code");
    if (code) verifier(await supabase().auth.exchangeCodeForSession(code));
    const { data } = await supabase().auth.getSession();
    if (!data.session) throw new Error("Le lien n'est plus valide.");
    const { user } = data.session;
    const enAttente = user.user_metadata && user.user_metadata.inscription;
    if (enAttente && !inscriptionLocale(user.email) && !(await lire("users", user.id))) {
        localStorage.setItem("inscriptionEnCours", JSON.stringify(enAttente));
        localStorage.setItem("emailForSignIn", user.email);
    }
    return user.id;
};

export const deconnecter = async () => {
    await supabase().auth.signOut();
};

export const ecouterSession = (rappel) => {
    const { data } = supabase().auth.onAuthStateChange((evenement, session) => {
        setTimeout(() => rappel(session ? session.user.id : null), 0);
    });
    return () => data.subscription.unsubscribe();
};
