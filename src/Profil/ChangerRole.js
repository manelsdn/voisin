import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSession } from "../composants/Session";
import { Ecran, Indice, Message } from "../composants/Mise";
import { DessinRole, Icone } from "../composants/Icones";
import { changerRole } from "../services/api";
import { ROLES } from "../services/constantes";

const CARTES = [
    { code: "JEUNE", titre: "Je donne un coup de main", texte: "Je publie mon annonce et mes créneaux." },
    { code: "ACCOMPAGNANT", titre: "J'accompagne un proche", texte: "J'organise l'aide pour lui." },
    { code: "SENIOR", titre: "Je cherche de l'aide", texte: "Je fais mes propres demandes." }
];

const ChangerRole = () => {
    const { utilisateur, recharger } = useSession();
    const [role, setRole] = useState(utilisateur.role);
    const [erreur, setErreur] = useState("");
    const [envoi, setEnvoi] = useState(false);
    const navigate = useNavigate();

    const valider = async () => {
        setEnvoi(true);
        try {
            await changerRole(utilisateur, role);
            await recharger();
            navigate(role === "ACCOMPAGNANT" ? "/proche" : role === "JEUNE" ? "/annonce" : "/accueil", { replace: true });
        } catch (e) {
            setErreur(e.message);
            setEnvoi(false);
        }
    };

    return (
        <Ecran titre={<>Changer <br />de rôle.</>} retour="/profil" surtitre="MON PROFIL">
            <p className="soft">Aujourd'hui : <strong>{ROLES[utilisateur.role]}</strong>. Vos messages et votre historique sont conservés.</p>
            <div className="role-list">
                {CARTES.map((r) => (
                    <button key={r.code} type="button" className="role-card" aria-pressed={role === r.code} onClick={() => setRole(r.code)}>
                        <DessinRole role={r.code} />
                        <span><strong>{r.titre}</strong><small>{r.texte}</small></span>
                        <span className="radio"></span>
                    </button>
                ))}
            </div>
            {utilisateur.role === "JEUNE" && role !== "JEUNE" && <Indice>Votre annonce sera retirée du quartier. Vous pourrez la republier si vous redevenez jeune volontaire.</Indice>}
            {role === "ACCOMPAGNANT" && utilisateur.role !== "ACCOMPAGNANT" && <Indice icone="users">Vous ajouterez ensuite la personne que vous accompagnez.</Indice>}
            <Message erreur={erreur} />
            <button className="primary" type="button" onClick={valider} disabled={envoi || role === utilisateur.role}><span>Confirmer mon nouveau rôle</span><Icone nom="arrow" /></button>
        </Ecran>
    );
};

export default ChangerRole;
