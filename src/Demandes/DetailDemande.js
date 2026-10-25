import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useSession } from "../composants/Session";
import { Astuce, BanniereService, Ecran, Indice, LienBouton, Message } from "../composants/Mise";
import { Icone } from "../composants/Icones";
import { infosLocales, laisserAvis, lireAvis, lireDemande, lireRendezVous, repondreDemande, terminerDemande } from "../services/api";
import { STATUTS, nomService, texteCreneau, texteDistance } from "../services/constantes";
import { texteDate } from "../services/geo";

const DetailDemande = () => {
    const { id } = useParams();
    const { utilisateur } = useSession();
    const [demande, setDemande] = useState(undefined);
    const [rdv, setRdv] = useState(null);
    const [erreur, setErreur] = useState("");
    const [avis, setAvis] = useState(null);
    const [note, setNote] = useState(0);
    const [infos, setInfos] = useState(null);

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
        setAvis(autorise && d.statut === "TERMINEE" ? await lireAvis(id).catch(() => null) : null);
    }, [id, utilisateur]);

    useEffect(() => { charger(); }, [charger]);

    const acceptee = demande && demande.statut === "ACCEPTEE";
    useEffect(() => {
        if (!acceptee) return;
        let actif = true;
        infosLocales(demande).then((r) => actif && setInfos(r || { meteo: null, lieux: [] })).catch(() => actif && setInfos({ meteo: null, lieux: [] }));
        return () => { actif = false; };
    }, [acceptee, demande]);

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

    const terminer = async () => {
        try {
            await terminerDemande(demande, utilisateur);
            setErreur("");
            await charger();
        } catch (e) {
            setErreur(e.message);
        }
    };

    const donnerAvis = async (e) => {
        e.preventDefault();
        try {
            await laisserAvis(demande, utilisateur, { note, commentaire: e.target.commentaire.value });
            setErreur("");
            await charger();
        } catch (err) {
            setErreur(err.message);
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
            {demande.photo && <img className="demande-photo" src={demande.photo} alt="Le besoin montré par le demandeur" />}
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
                {demande.statut === "ACCEPTEE" && estJeune && <button className="primary" type="button" onClick={terminer}><span>Service terminé</span><Icone nom="check" /></button>}
                {demande.statut === "TERMINEE" && !estJeune && <LienBouton to={`/jeunes/${demande.jeuneId}/demande?service=${demande.service}`} fleche>Redemander à {demande.jeunePrenom}</LienBouton>}
                <Link className="link-button" to={`/messages/${autre.id}`}>Échanger avec {autre.prenom}</Link>
            </div>
            {demande.statut === "ACCEPTEE" && <p className="soft"><small>Appelez-vous pour régler les derniers détails. Le pourboire reste libre.</small></p>}
            {demande.statut === "ACCEPTEE" && (
                <section className="detail-box infos-locales" aria-label="Infos locales">
                    <span className="mini-eyebrow">PRÈS DU RENDEZ-VOUS</span>
                    {!infos && <p className="soft"><small>Chargement de la météo et des lieux utiles…</small></p>}
                    {infos && (
                        <>
                            <div className="text-row"><span><Icone nom="sun" /> Météo du {texteDate(demande.dateSouhaitee)}</span><strong>{infos.meteo ? `${infos.meteo.texte} · ${infos.meteo.min}° / ${infos.meteo.max}°${infos.meteo.pluie != null ? ` · pluie ${infos.meteo.pluie} %` : ""}` : "Disponible quelques jours avant"}</strong></div>
                            {infos.lieux.length > 0 ? (
                                <ul className="lieux">
                                    {infos.lieux.map((l) => <li key={l.id}><span><Icone nom={l.type === "Pharmacie" ? "pin" : "bag"} /> {l.nom}</span><small>{l.type} · {texteDistance(l.distance)}</small></li>)}
                                </ul>
                            ) : <p className="soft"><small>Aucun commerce trouvé à moins de 1 km.</small></p>}
                        </>
                    )}
                </section>
            )}
            {demande.statut === "TERMINEE" && (avis ? (
                <section className="detail-box avis" aria-label="Avis">
                    <span className="mini-eyebrow">{estJeune ? `L'AVIS DE ${avis.auteurPrenom.toUpperCase()}` : "VOTRE AVIS"}</span>
                    <p className="etoiles" aria-label={`${avis.note} sur 5`}>{"★".repeat(avis.note)}{"☆".repeat(5 - avis.note)}</p>
                    {avis.commentaire && <p>{avis.commentaire}</p>}
                </section>
            ) : !estJeune && (
                <form className="form-stack detail-box avis" onSubmit={donnerAvis} noValidate>
                    <span className="mini-eyebrow">LAISSER UN AVIS</span>
                    <div className="etoiles-choix" role="radiogroup" aria-label="Note">
                        {[1, 2, 3, 4, 5].map((n) => <button key={n} type="button" role="radio" aria-checked={note === n} aria-label={`${n} sur 5`} className={n <= note ? "on" : ""} onClick={() => setNote(n)}>★</button>)}
                    </div>
                    <label>Un petit mot pour {demande.jeunePrenom}<textarea name="commentaire" maxLength={200} placeholder="Merci pour votre aide…" /></label>
                    <button className="primary" type="submit"><span>Publier mon avis</span><Icone nom="arrow" /></button>
                </form>
            ))}
        </Ecran>
    );
};

export default DetailDemande;
