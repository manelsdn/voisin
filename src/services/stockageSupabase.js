import { supabase } from "../configs/supabase";

const lienInitial = typeof window !== "undefined" ? window.location.href : "";

const TABLES = { users: "users", demandes: "demandes", rendezVous: "rendez_vous", messages: "messages" };
const table = (col) => supabase().from(TABLES[col] || col);
const doc = (ligne) => (ligne ? { id: ligne.id, ...ligne.data } : null);
const nouvelId = () => (window.crypto && window.crypto.randomUUID ? window.crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));

const verifier = ({ data, error }) => {
    if (error) throw new Error(error.message);
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

export const envoyerLien = async (email) => {
    verifier(await supabase().auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/reussite-inscription`, shouldCreateUser: true }
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
    return data.session.user.id;
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
