import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useSession } from "../composants/Session";
import { Ecran, Message } from "../composants/Mise";
import { Icone } from "../composants/Icones";
import { envoyerMessage, envoyerMessageVocal, lireConversation, lireUtilisateur } from "../services/api";
import { ROLES } from "../services/constantes";

const FORMATS = ["audio/webm", "audio/mp4", "audio/ogg"];

const heure = (iso) => new Date(iso).toLocaleString("fr-FR", { weekday: "short", hour: "2-digit", minute: "2-digit" });

const Conversation = () => {
    const { id } = useParams();
    const { utilisateur } = useSession();
    const [autre, setAutre] = useState(undefined);
    const [messages, setMessages] = useState([]);
    const [texte, setTexte] = useState("");
    const [erreur, setErreur] = useState("");
    const [enregistre, setEnregistre] = useState(false);
    const enregistreur = useRef(null);

    const charger = useCallback(async () => {
        try {
            setMessages(await lireConversation(utilisateur, id));
        } catch (e) {
            setErreur("La messagerie n'est pas encore disponible. Réessayez plus tard.");
        }
    }, [utilisateur, id]);

    useEffect(() => {
        lireUtilisateur(id).then((u) => setAutre(u && u.email !== null ? u : null));
        charger();
        const minuterie = setInterval(charger, 4000);
        return () => clearInterval(minuterie);
    }, [id, charger]);

    useEffect(() => () => {
        if (enregistreur.current) enregistreur.current.annuler();
    }, []);

    if (autre === undefined) return <Ecran retour="/messages"><p className="soft">Chargement…</p></Ecran>;
    if (autre === null || autre.id === utilisateur.id) return <Ecran retour="/messages" titre="Conversation introuvable"><div className="notice">Cette personne n'existe pas.</div></Ecran>;

    const envoyer = async (e) => {
        e.preventDefault();
        try {
            await envoyerMessage(utilisateur, autre, texte);
            setTexte("");
            setErreur("");
            await charger();
        } catch (err) {
            setErreur(err.code === "permission-denied" ? "La messagerie n'est pas encore disponible. Réessayez plus tard." : err.message);
        }
    };

    const demarrer = async () => {
        if (enregistreur.current) return;
        if (!navigator.mediaDevices || !window.MediaRecorder) {
            setErreur("Votre appareil ne permet pas d'enregistrer un message vocal.");
            return;
        }
        try {
            const flux = await navigator.mediaDevices.getUserMedia({ audio: true });
            const type = FORMATS.find((f) => MediaRecorder.isTypeSupported(f));
            const recorder = new MediaRecorder(flux, type ? { mimeType: type } : undefined);
            const morceaux = [];
            const debut = Date.now();
            let annule = false;
            recorder.ondataavailable = (e) => e.data.size && morceaux.push(e.data);
            recorder.onstop = async () => {
                flux.getTracks().forEach((piste) => piste.stop());
                clearTimeout(limite);
                enregistreur.current = null;
                setEnregistre(false);
                const duree = (Date.now() - debut) / 1000;
                if (annule || duree < 1) return;
                try {
                    await envoyerMessageVocal(utilisateur, autre, new Blob(morceaux, { type: recorder.mimeType || "audio/webm" }), Math.min(duree, 60));
                    setErreur("");
                    await charger();
                } catch (err) {
                    setErreur(err.message);
                }
            };
            const limite = setTimeout(() => recorder.state === "recording" && recorder.stop(), 60000);
            enregistreur.current = { arreter: () => recorder.state === "recording" && recorder.stop(), annuler: () => { annule = true; if (recorder.state === "recording") recorder.stop(); } };
            recorder.start();
            setEnregistre(true);
        } catch (e) {
            setErreur("Autorisez le micro pour envoyer un message vocal.");
        }
    };

    const arreter = () => enregistreur.current && enregistreur.current.arreter();

    return (
        <Ecran titre={autre.prenom} retour="/messages">
            <p className="soft">{ROLES[autre.role] || "Un voisin de votre quartier"}</p>
            <div className="notice">Présentez-vous, puis convenez du créneau et des détails du service. Le numéro de téléphone s'affiche une fois la demande acceptée.</div>
            <div className="conversation" aria-live="polite">
                {messages.map((m) => (
                    <div key={m.id} className={m.de === utilisateur.id ? "message-bubble mine" : "message-bubble"}>
                        {m.texte}
                        {m.audio && <audio controls preload="none" src={m.audio} aria-label="Message vocal" />}
                        <small>{m.de === utilisateur.id ? "Vous" : autre.prenom} · {heure(m.creeAt)}</small>
                    </div>
                ))}
            </div>
            <form className="form-stack" onSubmit={envoyer} noValidate>
                <label>Votre message<textarea name="message" maxLength={500} value={texte} onChange={(e) => setTexte(e.target.value)} placeholder="Bonjour, seriez-vous disponible…" /></label>
                <Message erreur={erreur} />
                <button type="submit" className="primary"><span>Envoyer</span><Icone nom="arrow" /></button>
                <button type="button" className={enregistre ? "secondary micro actif" : "secondary micro"} onPointerDown={demarrer} onPointerUp={arreter} onPointerLeave={arreter} onKeyDown={(e) => (e.key === " " || e.key === "Enter") && !e.repeat && demarrer()} onKeyUp={(e) => (e.key === " " || e.key === "Enter") && arreter()} onContextMenu={(e) => e.preventDefault()}>
                    <Icone nom="mic" />{enregistre ? "Relâchez pour envoyer" : "Maintenir pour un message vocal"}
                </button>
                <p className="soft"><small>1 minute maximum.</small></p>
            </form>
        </Ecran>
    );
};

export default Conversation;
