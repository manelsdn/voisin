import { useEffect, useRef, useState } from "react";
import { Icone } from "./Icones";

const moteurVocal = () => (typeof window === "undefined" ? null : window.SpeechRecognition || window.webkitSpeechRecognition || null);

const ERREURS = {
    "not-allowed": "Autorisez le micro pour pouvoir dicter.",
    "service-not-allowed": "Autorisez le micro pour pouvoir dicter.",
    "no-speech": "Je n'ai rien entendu, touchez le micro et parlez.",
    "network": "La dictée a besoin d'internet, réessayez."
};

const Dictee = ({ ajouter, libelle = "Dicter au lieu d'écrire" }) => {
    const [ecoute, setEcoute] = useState(false);
    const [provisoire, setProvisoire] = useState("");
    const [erreur, setErreur] = useState("");
    const moteur = useRef(null);
    const rappel = useRef(ajouter);
    rappel.current = ajouter;

    useEffect(() => () => {
        if (moteur.current) moteur.current.abort();
    }, []);

    const Moteur = moteurVocal();
    if (!Moteur) return null;

    const basculer = () => {
        if (ecoute && moteur.current) {
            moteur.current.stop();
            return;
        }
        const r = new Moteur();
        r.lang = "fr-FR";
        r.interimResults = true;
        r.continuous = true;
        r.onresult = (e) => {
            let final = "";
            let temporaire = "";
            for (let i = e.resultIndex; i < e.results.length; i += 1) {
                const morceau = e.results[i][0].transcript;
                if (e.results[i].isFinal) final += morceau;
                else temporaire += morceau;
            }
            if (final.trim()) rappel.current(final.trim());
            setProvisoire(temporaire);
        };
        r.onerror = (e) => setErreur(ERREURS[e.error] || "Je n'ai pas bien entendu, réessayez.");
        r.onend = () => {
            setEcoute(false);
            setProvisoire("");
        };
        moteur.current = r;
        setErreur("");
        setEcoute(true);
        try {
            r.start();
        } catch (err) {
            setEcoute(false);
        }
    };

    return (
        <div className="dictee">
            <button type="button" className={`dictee-bouton${ecoute ? " actif" : ""}`} aria-pressed={ecoute} onClick={basculer}>
                <span className="dictee-micro"><Icone nom="mic" /></span>
                <span>{ecoute ? "Je vous écoute… touchez pour arrêter" : libelle}</span>
            </button>
            {ecoute && <p className="dictee-provisoire" aria-live="polite">{provisoire ? `${provisoire}…` : "Parlez normalement, j'écris pour vous."}</p>}
            {erreur && <p className="dictee-erreur" role="status">{erreur}</p>}
        </div>
    );
};

export const enPhrase = (avant, texte, max) => {
    const morceau = texte.charAt(0).toUpperCase() + texte.slice(1);
    const debut = avant.trim();
    const lien = !debut ? "" : /[.!?]$/.test(debut) ? " " : ". ";
    return `${debut}${lien}${morceau}`.slice(0, max);
};

export default Dictee;
