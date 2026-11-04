import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useSession } from "../composants/Session";
import { Avatar, Ecran } from "../composants/Mise";
import { Icone } from "../composants/Icones";
import { ecouterMessages, lireUtilisateur, mesConversations } from "../services/api";
import { depuis } from "../services/constantes";
import { notificationsPossibles } from "../composants/AlerteMessages";

const Messages = () => {
    const { utilisateur } = useSession();
    const [conversations, setConversations] = useState(null);
    const [profils, setProfils] = useState({});
    const [permission, setPermission] = useState(notificationsPossibles() ? Notification.permission : "indisponible");
    const demandes = useRef(new Set());

    const charger = useCallback(async () => {
        const liste = await mesConversations(utilisateur).catch(() => []);
        setConversations(liste);
        liste.filter((c) => !demandes.current.has(c.id)).forEach((c) => {
            demandes.current.add(c.id);
            lireUtilisateur(c.id).then((u) => u && setProfils((p) => ({ ...p, [c.id]: u }))).catch(() => {});
        });
    }, [utilisateur]);

    useEffect(() => {
        charger();
        return ecouterMessages(utilisateur, charger);
    }, [utilisateur, charger]);

    return (
        <Ecran titre="Messages">
            <p className="soft">Discutez en direct avec les voisins, avant d'échanger un numéro.</p>
            {permission === "default" && (
                <button type="button" className="activer-notifs" onClick={() => Notification.requestPermission().then(setPermission)}>
                    <Icone nom="message" /><span><strong>Activer les notifications</strong><small>Soyez prévenu dès qu'un voisin vous écrit.</small></span>
                </button>
            )}
            {permission === "denied" && <p className="soft"><small>Notifications bloquées : vous pouvez les autoriser dans les réglages du navigateur.</small></p>}
            <Link className="nouveau-message" to="/messages/nouveau"><Icone nom="plus" /><span>Nouveau message</span></Link>
            {conversations === null && <div className="squelettes">{[0, 1, 2].map((i) => <span key={i} className="squelette" />)}</div>}
            {conversations && conversations.length === 0 && (
                <div className="vide vide-petit">
                    <span className="vide-icone"><Icone nom="message" /></span>
                    <strong>Aucune conversation pour le moment.</strong>
                    <p>Touchez « Nouveau message » pour écrire à un jeune du quartier.</p>
                </div>
            )}
            <div className="message-list chat-liste">
                {conversations && conversations.map((c) => {
                    const personne = profils[c.id] || { id: c.id, prenom: c.prenom };
                    const apercu = c.dernier.texte || (c.dernier.audio ? "Message vocal" : "");
                    return (
                        <Link key={c.id} to={`/messages/${c.id}`} className={c.nonLus ? "non-lu" : ""}>
                            <Avatar personne={personne} classe="helper-photo" />
                            <span className="chat-ligne">
                                <span className="chat-ligne-haut"><strong>{c.prenom}</strong><small>{depuis(c.dernier.creeAt)}</small></span>
                                <span className="chat-ligne-bas"><p className="soft">{c.dernier.de === utilisateur.id ? "Vous : " : ""}{apercu}</p>{c.nonLus > 0 && <b className="pastille-nb" aria-label={`${c.nonLus} non lus`}>{c.nonLus}</b>}</span>
                            </span>
                        </Link>
                    );
                })}
            </div>
        </Ecran>
    );
};

export default Messages;
