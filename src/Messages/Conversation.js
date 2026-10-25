import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useSession } from "../composants/Session";
import { Ecran, Message } from "../composants/Mise";
import { Icone } from "../composants/Icones";
import { envoyerMessage, lireConversation, lireUtilisateur } from "../services/api";
import { ROLES } from "../services/constantes";

const heure = (iso) => new Date(iso).toLocaleString("fr-FR", { weekday: "short", hour: "2-digit", minute: "2-digit" });

const Conversation = () => {
    const { id } = useParams();
    const { utilisateur } = useSession();
    const [autre, setAutre] = useState(undefined);
    const [messages, setMessages] = useState([]);
    const [texte, setTexte] = useState("");
    const [erreur, setErreur] = useState("");

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

    return (
        <Ecran titre={autre.prenom} retour="/messages">
            <p className="soft">{ROLES[autre.role] || "Un voisin de votre quartier"}</p>
            <div className="notice">Présentez-vous, puis convenez du créneau et des détails du service. Le numéro de téléphone s'affiche une fois la demande acceptée.</div>
            <div className="conversation" aria-live="polite">
                {messages.map((m) => (
                    <div key={m.id} className={m.de === utilisateur.id ? "message-bubble mine" : "message-bubble"}>
                        {m.texte}
                        <small>{m.de === utilisateur.id ? "Vous" : autre.prenom} · {heure(m.creeAt)}</small>
                    </div>
                ))}
            </div>
            <form className="form-stack" onSubmit={envoyer} noValidate>
                <label>Votre message<textarea name="message" maxLength={500} value={texte} onChange={(e) => setTexte(e.target.value)} placeholder="Bonjour, seriez-vous disponible…" /></label>
                <Message erreur={erreur} />
                <button type="submit" className="primary"><span>Envoyer</span><Icone nom="arrow" /></button>
            </form>
        </Ecran>
    );
};

export default Conversation;
