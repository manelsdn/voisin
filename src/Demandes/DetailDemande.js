import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useSession } from "../composants/Session";
import { Astuce, BanniereService, Ecran, Indice, LienBouton, Message } from "../composants/Mise";
import { Icone } from "../composants/Icones";
import { lireDemande, lireRendezVous, repondreDemande } from "../services/api";
import { STATUTS, nomService, texteCreneau, texteDistance } from "../services/constantes";
import { texteDate } from "../services/geo";

const DetailDemande = () => {
    const { id } = useParams();
    const { utilisateur } = useSession();
    const [demande, setDemande] = useState(undefined);
    const [rdv, setRdv] = useState(null);
    const [erreur, setErreur] = useState("");

    const charger = useCallback(async () => {
        let d = null;
        try {
            d = await lireDemande(id);
        } catch (e) {
            d = null;
        }
        const autorise = d && (d.jeuneId === utilisateur.id || d.demandeurId === utilisateur.id);
        setDemande(autorise ? d : null);
        setRdv(autorise && d.statut === "ACCEPTEE" ? await lireRendezVous(id) : null);
    }, [id, utilisateur]);

    useEffect(() => { charger(); }, [charger]);

    if (demande === undefined) return <Ecran retour><p className="soft">Chargement…</p></Ecran>;
    if (demande === null) return <Ecran retour="/services" titre="Demande introuvable"><div className="notice">Cette demande n'existe pas.</div></Ecran>;

    const estJeune = utilisateur.id === demande.jeuneId;
    const repondre = async (statut) => {
        try {
            await repondreDemande(demande, utilisateur, statut);
            setErreur("");
            await charger();
        } catch (e) {
            setErreur(e.message);
        }
    };

    const autre = estJeune ? { id: demande.demandeurId, prenom: demande.demandeurPrenom } : { id: demande.jeuneId, prenom: demande.jeunePrenom };
    const entete = [estJeune ? "DEMANDE REÇUE" : "MA DEMANDE", texteDistance(demande.distanceKm) && `À ${texteDistance(demande.distanceKm).toUpperCase()}`, estJeune ? `DE ${demande.demandeurPrenom.toUpperCase()}` : `AVEC ${demande.jeunePrenom.toUpperCase()}`].filter(Boolean).join(" · ");

    return (
        <Ecran retour="/services" titre={estJeune ? <>{nomService(demande.service)} pour {demande.beneficiairePrenom}</> : <>{nomService(demande.service)} avec {demande.jeunePrenom}</>}>
            <BanniereService code={demande.service} />
            <span className="mini-eyebrow">{entete}</span>
            <div className="detail-box">
                <h3>{nomService(demande.service)}</h3>
                <p>{texteCreneau(demande.creneau)} · {texteDate(demande.dateSouhaitee)}</p>
                <p><em className={`statut ${demande.statut}`}>{STATUTS[demande.statut]}</em></p>
                <div className="text-row numero"><span><Icone nom="phone" /> Numéro</span><strong>{rdv ? (estJeune ? rdv.telephoneDemandeur : rdv.telephoneJeune) : "Visible après acceptation"}</strong></div>
            </div>
            <p>{demande.description}</p>
            {estJeune && demande.beneficiaireId !== demande.demandeurId && <Indice icone="users">Vous échangez avec {demande.demandeurPrenom}. {demande.beneficiairePrenom} vous accueille le jour du service.</Indice>}
            <Astuce>Pourboire libre, directement avec {demande.beneficiairePrenom}.</Astuce>
            <Message erreur={erreur} />
            <div className="stack-actions">
                {demande.statut === "ENVOYEE" && estJeune && (
                    <>
                        <button className="primary" type="button" onClick={() => repondre("ACCEPTEE")}><span>Accepter la demande</span><Icone nom="arrow" /></button>
                        <button className="secondary" type="button" onClick={() => repondre("REFUSEE")}>Refuser</button>
                    </>
                )}
                {demande.statut === "ENVOYEE" && !estJeune && <button className="secondary" type="button" onClick={() => repondre("ANNULEE")}>Annuler ma demande</button>}
                {demande.statut === "REFUSEE" && !estJeune && <LienBouton to="/recherche" fleche>Choisir un autre jeune</LienBouton>}
                <Link className="link-button" to={`/messages/${autre.id}`}>Échanger avec {autre.prenom}</Link>
            </div>
            {demande.statut === "ACCEPTEE" && <p className="soft"><small>Appelez-vous pour régler les derniers détails. Le pourboire reste libre.</small></p>}
        </Ecran>
    );
};

export default DetailDemande;
