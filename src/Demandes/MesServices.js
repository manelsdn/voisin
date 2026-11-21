import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSession } from "../composants/Session";
import { Ecran, EtatService, LienBouton, prochaineEtape } from "../composants/Mise";
import { Icone } from "../composants/Icones";
import { mesDemandes } from "../services/api";
import { imageService, nomComplet, texteQuand } from "../services/constantes";
import { CarteMonBesoin, chargerMesBesoins } from "../Besoins/MesBesoins";

const PASSES = ["TERMINEE", "REFUSEE", "ANNULEE", "EXPIREE"];

const MesServices = () => {
    const { utilisateur } = useSession();
    const [demandes, setDemandes] = useState(null);
    const estJeune = utilisateur.role === "JEUNE";
    const [onglet, setOnglet] = useState("avenir");

    const [besoins, setBesoins] = useState(null);

    useEffect(() => { mesDemandes(utilisateur).then(setDemandes); }, [utilisateur]);
    useEffect(() => { if (!estJeune) chargerMesBesoins(utilisateur).then(setBesoins).catch(() => setBesoins([])); }, [utilisateur, estJeune]);

    const ouvertes = (besoins || []).filter((b) => b.statut === "OUVERTE");

    const urgent = (d) => (estJeune && d.statut === "ENVOYEE" ? 0 : d.statut === "ACCEPTEE" ? 1 : 2);
    const affiches = (demandes || []).filter((d) => (onglet === "passes") === PASSES.includes(d.statut)).sort((a, b) => urgent(a) - urgent(b));
    const aRepondre = (demandes || []).filter((d) => estJeune && d.statut === "ENVOYEE").length;

    return (
        <Ecran titre={estJeune ? "Mes missions" : "Mes demandes"}>
            {aRepondre > 0 && <p className="alerte-a-faire" role="status"><Icone nom="bell" /> {aRepondre === 1 ? "1 demande attend votre réponse." : `${aRepondre} demandes attendent votre réponse.`}</p>}
            {(!estJeune || (demandes && demandes.length > 0)) && (
                <div className="onglets" role="tablist" aria-label={estJeune ? "Mes missions" : "Mes demandes"}>
                    <button type="button" role="tab" aria-selected={onglet === "avenir"} onClick={() => setOnglet("avenir")}>En cours</button>
                    {!estJeune && <button type="button" role="tab" aria-selected={onglet === "annonces"} onClick={() => setOnglet("annonces")}>Annonces{ouvertes.length ? ` (${ouvertes.length})` : ""}</button>}
                    <button type="button" role="tab" aria-selected={onglet === "passes"} onClick={() => setOnglet("passes")}>Historique</button>
                </div>
            )}
            {demandes === null && <p className="soft">Chargement…</p>}
            {onglet === "annonces" && (
                <div className="liste-cartes">
                    {besoins === null && <p className="soft">Chargement…</p>}
                    {besoins && besoins.length === 0 && <p className="soft">Vous n'avez pas encore publié d'annonce.</p>}
                    {besoins && besoins.map((b) => <CarteMonBesoin key={b.id} besoin={b} />)}
                    <LienBouton to="/besoins/nouveau" fleche>Publier un besoin</LienBouton>
                </div>
            )}
            {onglet !== "annonces" && demandes && demandes.length === 0 && (
                <div className="empty">
                    <div className="success-icon"><Icone nom="calendar" /></div>
                    <h3>Le premier coup de main <br />vous attend.</h3>
                    <p className="soft">Vos demandes et services à venir apparaîtront ici.</p>
                    {estJeune ? <LienBouton to="/annonce" fleche>Publier mon annonce</LienBouton> : <LienBouton to="/recherche" fleche>Explorer le quartier</LienBouton>}
                </div>
            )}
            <div className="stack-actions">
                {onglet !== "annonces" && demandes && demandes.length > 0 && affiches.length === 0 && <p className="soft">{onglet === "avenir" ? "Rien en cours pour le moment." : "L'historique est vide pour le moment."}</p>}
                {onglet !== "annonces" && affiches.map((d) => (
                    <Link key={d.id} to={`/demandes/${d.id}`} className={`helper-card helper-card-rich carte-suivi${estJeune && d.statut === "ENVOYEE" ? " a-faire" : ""}`}>
                        <img className="helper-photo" src={imageService(d.service)} alt="" />
                        <span>
                            <strong>{nomComplet(d.service, d.sousService)} · {estJeune ? `pour ${d.beneficiairePrenom}` : `avec ${d.jeunePrenom}`}</strong>
                            <small>{texteQuand(d.creneau, d.dateSouhaitee)}</small>
                            <span className="slot-row"><EtatService statut={d.statut} estJeune={estJeune} /></span>
                            <small className="prochaine">{prochaineEtape(d, estJeune, true, true)}</small>
                        </span>
                        <Icone nom="chevron" />
                    </Link>
                ))}
            </div>
        </Ecran>
    );
};

export default MesServices;
