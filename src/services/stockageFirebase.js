import { collection, doc, getDoc, getDocs, query, setDoc, addDoc, where } from "firebase/firestore";
import { isSignInWithEmailLink, onAuthStateChanged, sendSignInLinkToEmail, signInWithEmailLink, signOut } from "firebase/auth";
import { firestoreDB, firebaseAuth } from "../configs/firebase";

export const lire = async (col, id) => {
    const snap = await getDoc(doc(firestoreDB, col, id));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

export const ecrire = (col, id, data) => setDoc(doc(firestoreDB, col, id), data, { merge: true });

export const ajouter = async (col, data) => (await addDoc(collection(firestoreDB, col), data)).id;

export const chercher = async (col, champ, valeur) => {
    const snap = await getDocs(query(collection(firestoreDB, col), where(champ, "==", valeur)));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const envoyerLien = async (email) => {
    await sendSignInLinkToEmail(firebaseAuth, email, {
        url: `${window.location.origin}/reussite-inscription`,
        handleCodeInApp: true
    });
    return {};
};

export const estLien = (href) => isSignInWithEmailLink(firebaseAuth, href);

export const validerLien = async (href, email) => (await signInWithEmailLink(firebaseAuth, email, href)).user.uid;

export const deconnecter = () => signOut(firebaseAuth);

export const ecouterSession = (rappel) => onAuthStateChanged(firebaseAuth, (u) => rappel(u ? u.uid : null));
