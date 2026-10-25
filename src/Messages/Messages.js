import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSession } from "../composants/Session";
import { Ecran, Indice, LienBouton } from "../composants/Mise";
import { mesConversations } from "../services/api";

const Messages = () => {
    const { utilisateur } = useSession();
    const [conversations, setConversations] = useState(null);

    useEffect(() => { mesConversations(utilisateur).then(setConversations); }, [utilisateur]);

    return (
        <Ecran titre="On garde le lien.">
            <p className="soft">Les petits détails se règlent ensemble, avant d'échanger un numéro.</p>
            {conversations === null && <p className="soft">Chargement…</p>}
            {conversations && conversations.length === 0 && (
                <>
                    <div className="notice">Aucune conversation pour le moment. Depuis le profil d'un jeune ou une demande, appuyez sur « Échanger avec… ».</div>
                    <div className="stack-actions"><LienBouton to="/services" fleche>Voir mes services</LienBouton></div>
                </>
            )}
            <div className="message-list">
                {conversations && conversations.map((c) => (
                    <Link key={c.id} to={`/messages/${c.id}`}>
                        <b className="helper-photo initial-avatar" aria-hidden="true">{(c.prenom || "?")[0]}</b>
                        <span>
                            <h3>{c.prenom}</h3>
                            <p className="soft">{c.dernier.de === utilisateur.id ? "Vous : " : ""}{c.dernier.texte}</p>
                        </span>
                    </Link>
                ))}
            </div>
            <Indice icone="message">Le numéro de téléphone s'affiche dans la demande, une fois qu'elle est acceptée.</Indice>
        </Ecran>
    );
};

export default Messages;
