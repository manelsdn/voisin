import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useSession } from "../composants/Session";
import { Avatar, Ecran, Message, Retour } from "../composants/Mise";
import { Icone } from "../composants/Icones";
import { ecouterMessages, envoyerFichier, envoyerMessage, envoyerMessageVocal, lireConversation, lireUtilisateur, marquerLus } from "../services/api";
import { ROLES } from "../services/constantes";

const FORMATS = ["audio/webm", "audio/mp4", "audio/ogg"];

const heure = (iso) => new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

const jour = (iso) => {
    const d = new Date(iso);
    const auj = new Date();
    const hier = new Date(auj.getTime() - 86400000);
    if (d.toDateString() === auj.toDateString()) return "Aujourd'hui";
    if (d.toDateString() === hier.toDateString()) return "Hier";
    return d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
};

const Conversation = () => {
    const { id } = useParams();
    const { utilisateur } = useSession();
    const [autre, setAutre] = useState(undefined);
    const [messages, setMessages] = useState([]);
    const [texte, setTexte] = useState("");
    const [erreur, setErreur] = useState("");
    const [enregistre, setEnregistre] = useState(false);
    const [envoi, setEnvoi] = useState(false);
    const enregistreur = useRef(null);
    const fil = useRef(null);
    const choixFichier = useRef(null);
    const [piece, setPiece] = useState(null);

    const charger = useCallback(async () => {
        try {
            const liste = await lireConversation(utilisateur, id);
            setMessages(liste);
            if (liste.some((m) => m.a === utilisateur.id && !m.lu)) marquerLus(utilisateur, id).catch(() => {});
        } catch (e) {
            setErreur("La messagerie n'est pas encore disponible. Réessayez plus tard.");
        }
    }, [utilisateur, id]);

    useEffect(() => {
        lireUtilisateur(id).then((u) => setAutre(u && u.email !== null ? u : null)).catch(() => setAutre(null));
        charger();
        return ecouterMessages(utilisateur, charger);
    }, [id, charger, utilisateur]);

    useEffect(() => {
        if (fil.current) fil.current.scrollTop = fil.current.scrollHeight;
        window.scrollTo(0, document.body.scrollHeight);
    }, [messages.length]);

    useEffect(() => () => {
        if (enregistreur.current) enregistreur.current.annuler();
    }, []);

    if (autre === undefined) return <Ecran retour="/messages"><p className="soft">Chargement…</p></Ecran>;
    if (autre === null || autre.id === utilisateur.id) return <Ecran retour="/messages" titre="Conversation introuvable"><div className="notice">Cette personne n'existe pas.</div></Ecran>;

    const envoyer = async (e) => {
        if (e) e.preventDefault();
        if (envoi) return;
        setEnvoi(true);
        try {
            if (piece) await envoyerFichier(utilisateur, autre, piece, texte);
            else await envoyerMessage(utilisateur, autre, texte);
            setPiece(null);
            setTexte("");
            setErreur("");
            await charger();
        } catch (err) {
            setErreur(err.code === "permission-denied" ? "La messagerie n'est pas encore disponible. Réessayez plus tard." : err.message);
        }
        setEnvoi(false);
    };

    const touche = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            envoyer();
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

    const estJeune = autre.role === "JEUNE";
    let dernierJour = "";

    return (
        <div className="ecran vdo chat" id="vdo">
            <header className="chat-haut">
                <Retour vers="/messages" />
                <Link className="chat-qui" to={estJeune ? `/jeunes/${autre.id}` : "#"} onClick={(e) => !estJeune && e.preventDefault()}>
                    <Avatar personne={autre} classe="chat-photo" />
                    <span><h1>{autre.prenom}</h1><small>{ROLES[autre.role] || "Un voisin de votre quartier"}</small></span>
                </Link>
            </header>
            <main className="chat-fil" ref={fil} aria-live="polite">
                <p className="chat-info"><Icone nom="phone" />Le numéro s'affiche une fois une demande acceptée. Présentez-vous et convenez des détails ici.</p>
                {messages.length === 0 && <p className="chat-vide">Dites bonjour à {autre.prenom} 👋</p>}
                {messages.map((m) => {
                    const j = jour(m.creeAt);
                    const separateur = j !== dernierJour;
                    dernierJour = j;
                    const moi = m.de === utilisateur.id;
                    return (
                        <div key={m.id} className="chat-bloc">
                            {separateur && <p className="chat-jour"><span>{j}</span></p>}
                            <div className={moi ? "message-bubble mine" : "message-bubble"}>
                                {m.texte}
                                {m.audio && <audio controls preload="none" src={m.audio} aria-label="Message vocal" />}
                                {m.fichier && (m.fichier.type || "").startsWith("image/") && <a href={m.fichier.url} target="_blank" rel="noopener noreferrer" className="chat-image"><img src={m.fichier.url} alt={`Envoyé : ${m.fichier.nom}`} /></a>}
                                {m.fichier && !(m.fichier.type || "").startsWith("image/") && <a href={m.fichier.url} target="_blank" rel="noopener noreferrer" download={m.fichier.nom} className="chat-fichier"><Icone nom="clip" /><span><strong>{m.fichier.nom}</strong><small>{Math.max(1, Math.round((m.fichier.taille || 0) / 1024))} Ko · Ouvrir</small></span></a>}
                                <small>{moi ? "Vous" : autre.prenom} · {heure(m.creeAt)}{moi && m.lu ? " · Lu" : ""}</small>
                            </div>
                        </div>
                    );
                })}
            </main>
            <footer className="chat-pied"><form className="chat-saisie" onSubmit={envoyer} noValidate>
                <Message erreur={erreur} />
                {piece && (
                    <div className="chat-piece">
                        <Icone nom="clip" /><span>{piece.name}</span>
                        <button type="button" aria-label="Retirer le fichier joint" onClick={() => setPiece(null)}>×</button>
                    </div>
                )}
                <div className="chat-ligne-saisie">
                    <input ref={choixFichier} type="file" className="sr-only" tabIndex={-1} aria-hidden="true" accept="image/*,.pdf,.doc,.docx,.txt" onChange={(e) => { setPiece(e.target.files[0] || null); e.target.value = ""; }} />
                    <button type="button" className="chat-joindre" aria-label="Joindre une image ou un fichier" onClick={() => choixFichier.current && choixFichier.current.click()}><Icone nom="clip" /></button>
                    <button type="button" aria-label={enregistre ? "Relâchez pour envoyer" : "Maintenir pour un message vocal"} className={enregistre ? "chat-micro actif" : "chat-micro"} onPointerDown={demarrer} onPointerUp={arreter} onPointerLeave={arreter} onKeyDown={(e) => (e.key === " " || e.key === "Enter") && !e.repeat && demarrer()} onKeyUp={(e) => (e.key === " " || e.key === "Enter") && arreter()} onContextMenu={(e) => e.preventDefault()}>
                        <Icone nom="mic" />
                    </button>
                    <label className="chat-champ"><span className="sr-only">Votre message</span><textarea name="message" rows={1} maxLength={500} value={texte} onChange={(e) => setTexte(e.target.value)} onKeyDown={touche} placeholder={enregistre ? "Je vous écoute… relâchez pour envoyer" : `Écrire à ${autre.prenom}…`} /></label>
                    <button type="submit" className="chat-envoyer" aria-label="Envoyer" disabled={envoi}><Icone nom="arrow" /></button>
                </div>
            </form></footer>
        </div>
    );
};

export default Conversation;
