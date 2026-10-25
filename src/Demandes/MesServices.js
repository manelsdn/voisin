import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSession } from "../composants/Session";
import { Ecran, LienBouton } from "../composants/Mise";
import { Icone } from "../composants/Icones";
import { mesDemandes } from "../services/api";
import { STATUTS, imageService, nomService, texteCreneau } from "../services/constantes";
import { texteDate } from "../services/geo";

const PASSES = ["TERMINEE", "REFUSEE", "ANNULEE"];

const MesServices = () => {
    const { utilisateur } = useSession();
    const [demandes, setDemandes] = useState(null);
    const estJeune = utilisateur.role === "JEUNE";
    const [onglet, setOnglet] = useState("avenir");

    useEffect(() => { mesDemandes(utilisateur).then(setDemandes); }, [utilisateur]);

    const affiches = (demandes || []).filter((d) => (onglet === "passes") === PASSES.includes(d.statut));

    return (
        <Ecran titre={<>Les liens <br />qui se préparent.</>}>
            <p className="soft">{estJeune ? "Les demandes que vous avez reçues." : "Les demandes que vous avez envoyées."} Vos coups de main, au même endroit.</p>
            {demandes && demandes.length > 0 && (
                <div className="onglets" role="tablist" aria-label="Mes services">
                    <button type="button" role="tab" aria-selected={onglet === "avenir"} onClick={() => setOnglet("avenir")}>À venir</button>
                    <button type="button" role="tab" aria-selected={onglet === "passes"} onClick={() => setOnglet("passes")}>Passés</button>
                </div>
            )}
            {demandes === null && <p className="soft">Chargement…</p>}
            {demandes && demandes.length === 0 && (
                <div className="empty">
                    <div className="success-icon"><Icone nom="calendar" /></div>
                    <h3>Le premier coup de main <br />vous attend.</h3>
                    <p className="soft">Vos demandes et services à venir apparaîtront ici.</p>
                    {estJeune ? <LienBouton to="/annonce" fleche>Publier mon annonce</LienBouton> : <LienBouton to="/recherche" fleche>Explorer le quartier</LienBouton>}
                </div>
            )}
            <div className="stack-actions">
                {demandes && demandes.length > 0 && affiches.length === 0 && <p className="soft">{onglet === "avenir" ? "Aucun service à venir pour le moment." : "Aucun service passé pour le moment."}</p>}
                {affiches.map((d) => (
                    <Link key={d.id} to={`/demandes/${d.id}`} className="helper-card helper-card-rich">
                        <img className="helper-photo" src={imageService(d.service)} alt="" />
                        <span>
                            <strong>{nomService(d.service)} · {estJeune ? `pour ${d.beneficiairePrenom}` : `avec ${d.jeunePrenom}`}</strong>
                            <small>{texteCreneau(d.creneau)}{d.dateSouhaitee ? ` · ${texteDate(d.dateSouhaitee)}` : ""}</small>
                            <span className="slot-row"><em className={`statut ${d.statut}`}>{STATUTS[d.statut]}</em></span>
                        </span>
                        <Icone nom="chevron" />
                    </Link>
                ))}
            </div>
        </Ecran>
    );
};

export default MesServices;
