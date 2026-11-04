import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useSession } from "../composants/Session";
import { Astuce, Avatar, BanniereService, Ecran, LienBouton, Message } from "../composants/Mise";
import { Icone } from "../composants/Icones";
import { changerStatutBesoin, lireBesoin, maProposition, pointDeRecherche, proposerAide, propositionsDuBesoin } from "../services/api";
import { distanceKm } from "../services/geo";
import { STATUTS_BESOIN, depuis, nomService, texteCreneau, texteDistance } from "../services/constantes";

const DetailBesoin = () => {
    const { id } = useParams();
    const { utilisateur } = useSession();
    const [besoin, setBesoin] = useState(undefined);
    const [distance, setDistance] = useState(null);
    const [propositions, setPropositions] = useState([]);
    const [proposee, setProposee] = useState(null);
    const [message, setMessage] = useState("");
    const [erreur, setErreur] = useState("");
    const [envoi, setEnvoi] = useState(false);

    const charger = useCallback(async () => {
        let b = null;
        try {
            b = await lireBesoin(id);
        } catch (e) {
            b = null;
        }
        setBesoin(b);
        if (!b) return;
        if (b.auteurId === utilisateur.id) {
            setPropositions(await propositionsDuBesoin(b.id).catch(() => []));
        } else {
            setDistance(distanceKm((await pointDeRecherche(utilisateur)).position, b));
            if (utilisateur.role === "JEUNE") setProposee(await maProposition(b.id, utilisateur.id).catch(() => null));
        }
    }, [id, utilisateur]);

    useEffect(() => { charger(); }, [charger]);

    if (besoin === undefined) return <Ecran retour><p className="soft">Chargement…</p></Ecran>;
    if (besoin === null) return <Ecran retour="/recherche" titre="Annonce introuvable"><div className="notice">Cette annonce n'existe pas ou a été retirée.</div></Ecran>;

    const auteur = besoin.auteurId === utilisateur.id;
    const pourQuelquun = besoin.beneficiaireId !== besoin.auteurId;

    const proposer = async (e) => {
        e.preventDefault();
        setEnvoi(true);
        try {
            await proposerAide(besoin, utilisateur, message);
            setErreur("");
            await charger();
        } catch (err) {
            setErreur(err.message);
        }
        setEnvoi(false);
    };

    const statut = async (s) => {
        try {
            await changerStatutBesoin(besoin, utilisateur, s);
            await charger();
        } catch (err) {
            setErreur(err.message);
        }
    };

    return (
        <Ecran retour={auteur ? "/besoins" : "/recherche"} surtitre={auteur ? "MON ANNONCE" : "UN BESOIN DU QUARTIER"} titre={<>{nomService(besoin.service)} <br />pour {besoin.beneficiairePrenom}</>}>
            <BanniereService code={besoin.service} />
            <div className="besoin-meta">
                <em className={`statut ${besoin.statut === "OUVERTE" ? "ACCEPTEE" : "ANNULEE"}`}>{STATUTS_BESOIN[besoin.statut]}</em>
                <span>{depuis(besoin.creeAt)}</span>
                {!auteur && distance !== null && <span><Icone nom="pin" />{texteDistance(distance)} · {besoin.ville}</span>}
            </div>
            <div className="detail-box">
                <p className="besoin-texte">{besoin.description}</p>
                <div className="text-row"><span><Icone nom="clock" /> Quand</span><strong>{besoin.creneau ? texteCreneau(besoin.creneau) : "À convenir ensemble"}</strong></div>
                {pourQuelquun && <div className="text-row"><span><Icone nom="users" /> Publiée par</span><strong>{besoin.auteurPrenom}, pour {besoin.beneficiairePrenom}</strong></div>}
            </div>

            {auteur ? (
                <>
                    <h3 className="section-h">Propositions <span className="pastille-nb">{propositions.length}</span></h3>
                    {propositions.length === 0 && <div className="vide vide-petit"><span className="vide-icone"><Icone nom="heart" /></span><strong>Pas encore de proposition.</strong><p>Les jeunes du quartier voient votre annonce. Vous serez prévenu dans vos messages.</p></div>}
                    <div className="liste-cartes">
                        {propositions.map((p) => {
                            const jeune = { id: p.jeuneId, prenom: p.jeunePrenom, photoProfil: p.jeunePhoto, role: "JEUNE" };
                            return (
                                <article className="carte-proposition" key={p.id}>
                                    <header><Avatar personne={jeune} classe="carte-photo" /><span><strong>{p.jeunePrenom}</strong><small>{depuis(p.creeAt)}</small></span></header>
                                    <p>« {p.message} »</p>
                                    <div className="carte-actions">
                                        <Link className="secondary" to={`/jeunes/${p.jeuneId}`}>Voir le profil</Link>
                                        {besoin.statut === "OUVERTE" && <Link className="primary" to={`/jeunes/${p.jeuneId}/demande?service=${besoin.service}&besoin=${besoin.id}`}>Lui envoyer une demande</Link>}
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                    <Message erreur={erreur} />
                    <div className="stack-actions">
                        {besoin.statut === "OUVERTE"
                            ? <button className="secondary" type="button" onClick={() => statut("FERMEE")}>Clore l'annonce</button>
                            : <button className="secondary" type="button" onClick={() => statut("OUVERTE")}>Rouvrir l'annonce</button>}
                    </div>
                </>
            ) : utilisateur.role === "JEUNE" ? (
                proposee ? (
                    <div className="confirmation">
                        <span className="ok-rond"><Icone nom="check" /></span>
                        <div><strong>Vous avez proposé votre aide</strong><p>{besoin.auteurPrenom} a reçu votre message. Vous pouvez continuer la discussion dans vos messages.</p></div>
                        <LienBouton to={`/messages/${besoin.auteurId}`} secondaire>Écrire à {besoin.auteurPrenom}</LienBouton>
                    </div>
                ) : besoin.statut === "OUVERTE" ? (
                    <form className="form-stack actions-flottantes-form" onSubmit={proposer} noValidate>
                        <label>Un petit mot pour {besoin.auteurPrenom} (facultatif)<textarea name="message" maxLength={300} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Bonjour, je suis disponible samedi matin…" /></label>
                        <Astuce>Votre numéro reste privé. {besoin.auteurPrenom} choisira s'il vous envoie une demande.</Astuce>
                        <Message erreur={erreur} />
                        <button className="primary" type="submit" disabled={envoi}><span>Proposer mon aide</span><Icone nom="heart" /></button>
                    </form>
                ) : <div className="notice">Cette annonce n'est plus ouverte.</div>
            ) : <div className="notice">Seuls les jeunes volontaires peuvent proposer leur aide.</div>}
        </Ecran>
    );
};

export default DetailBesoin;
