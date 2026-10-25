import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Ecran, LienBouton } from "../composants/Mise";
import { Icone } from "../composants/Icones";
import { lireDemande } from "../services/api";
import { STATUTS, nomService, texteCreneau } from "../services/constantes";
import { texteDate } from "../services/geo";

const DemandeEnvoyee = () => {
    const { id } = useParams();
    const [demande, setDemande] = useState(null);

    useEffect(() => { lireDemande(id).then(setDemande); }, [id]);

    return (
        <Ecran retour="/accueil">
            <div className="success-icon"><Icone nom="check" /></div>
            <div className="profile-name">
                <span className="mini-eyebrow">UN PREMIER LIEN SE CRÉE</span>
                <h2>Votre demande <br />est envoyée !</h2>
                {demande && <p className="soft">{demande.jeunePrenom} va accepter ou refuser votre demande. Son numéro s'affichera une fois la demande acceptée.</p>}
            </div>
            {demande && (
                <div className="detail-box">
                    <h3>{nomService(demande.service)} avec {demande.jeunePrenom}</h3>
                    <p>{texteCreneau(demande.creneau)} · {texteDate(demande.dateSouhaitee)}</p>
                    <p><em className={`statut ${demande.statut}`}>{STATUTS[demande.statut]}</em></p>
                    <div className="text-row"><span><Icone nom="phone" /> Numéro de {demande.jeunePrenom}</span><strong>Visible après acceptation</strong></div>
                </div>
            )}
            <div className="stack-actions">
                <LienBouton to="/services" fleche>Voir mes services</LienBouton>
                <LienBouton to="/accueil" secondaire>Retour à l'accueil</LienBouton>
            </div>
        </Ecran>
    );
};

export default DemandeEnvoyee;
