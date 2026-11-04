import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useSession } from "./Session";
import { Icone } from "./Icones";
import { ecouterMessages, messagesRecus } from "../services/api";

const TITRE = "Voisin d'Or - Petits services. Grands liens.";

export const notificationsPossibles = () => typeof window !== "undefined" && "Notification" in window;

const AlerteMessages = () => {
    const { utilisateur } = useSession();
    const { pathname } = useLocation();
    const navigate = useNavigate();
    const [alerte, setAlerte] = useState(null);
    const connus = useRef(null);
    const chemin = useRef(pathname);
    chemin.current = pathname;

    useEffect(() => {
        if (!utilisateur) {
            connus.current = null;
            document.title = TITRE;
            return undefined;
        }
        let actif = true;
        const verifier = async () => {
            const recus = await messagesRecus(utilisateur).catch(() => null);
            if (!actif || !recus) return;
            const nonLus = recus.filter((m) => !m.lu);
            document.title = nonLus.length ? `(${nonLus.length}) ${TITRE}` : TITRE;
            if (connus.current === null) {
                connus.current = new Set(recus.map((m) => m.id));
                return;
            }
            const nouveaux = nonLus.filter((m) => !connus.current.has(m.id)).sort((a, b) => (a.creeAt || "").localeCompare(b.creeAt || ""));
            recus.forEach((m) => connus.current.add(m.id));
            const dernier = nouveaux[nouveaux.length - 1];
            if (!dernier || chemin.current === `/messages/${dernier.de}`) return;
            const texte = dernier.texte || (dernier.audio ? "Message vocal" : "Nouveau message");
            setAlerte({ id: dernier.id, de: dernier.de, prenom: dernier.dePrenom || "Un voisin", texte });
            if (notificationsPossibles() && Notification.permission === "granted" && document.hidden) {
                const notif = new Notification(`${dernier.dePrenom || "Un voisin"} vous a écrit`, { body: texte, icon: "/logo192.png", tag: `message-${dernier.de}` });
                notif.onclick = () => {
                    window.focus();
                    navigate(`/messages/${dernier.de}`);
                    notif.close();
                };
            }
        };
        verifier();
        const arreter = ecouterMessages(utilisateur, verifier);
        return () => {
            actif = false;
            arreter();
        };
    }, [utilisateur, navigate]);

    useEffect(() => {
        if (!alerte) return undefined;
        const minuterie = setTimeout(() => setAlerte(null), 7000);
        return () => clearTimeout(minuterie);
    }, [alerte]);

    useEffect(() => {
        if (alerte && pathname === `/messages/${alerte.de}`) setAlerte(null);
    }, [pathname, alerte]);

    if (!alerte) return null;
    return (
        <div className="alerte-message" role="status" aria-live="polite">
            <Link to={`/messages/${alerte.de}`} onClick={() => setAlerte(null)}>
                <span className="alerte-icone"><Icone nom="message" /></span>
                <span className="alerte-texte"><strong>Nouveau message de {alerte.prenom}</strong><small>{alerte.texte}</small></span>
            </Link>
            <button type="button" aria-label="Fermer la notification" onClick={() => setAlerte(null)}>×</button>
        </div>
    );
};

export default AlerteMessages;
