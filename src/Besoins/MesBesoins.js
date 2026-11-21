import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSession } from "../composants/Session";
import { Ecran } from "../composants/Mise";
import { Icone } from "../composants/Icones";
import { mesBesoins, propositionsDuBesoin } from "../services/api";
import { STATUTS_BESOIN, depuis, iconeService, imageService, nomComplet, texteQuandBesoin } from "../services/constantes";

export const CarteMonBesoin = ({ besoin }) => (
    <Link to={`/besoins/${besoin.id}`} className="carte-profil carte-besoin">
        <span className="carte-photo carte-service"><img src={imageService(besoin.service)} alt="" /><i><Icone nom={iconeService(besoin.service)} /></i></span>
        <span className="carte-corps">
            <span className="carte-ligne"><strong>{nomComplet(besoin.service, besoin.sousService)} pour {besoin.beneficiairePrenom}</strong></span>
            <small>{depuis(besoin.creeAt)}{besoin.creneau || besoin.date ? ` · ${texteQuandBesoin(besoin)}` : ""}</small>
            <span className="carte-bas"><em className={`statut ${besoin.statut === "OUVERTE" ? "ACCEPTEE" : "ANNULEE"}`}>{STATUTS_BESOIN[besoin.statut]}</em><em>{besoin.propositions} proposition{besoin.propositions > 1 ? "s" : ""}</em></span>
        </span>
        <Icone nom="chevron" />
    </Link>
);

export const chargerMesBesoins = async (utilisateur) => {
    const liste = await mesBesoins(utilisateur);
    return Promise.all(liste.map(async (b) => ({ ...b, propositions: (await propositionsDuBesoin(b.id).catch(() => [])).length })));
};

const MesBesoins = () => {
    const { utilisateur } = useSession();
    const [besoins, setBesoins] = useState(null);

    useEffect(() => {
        chargerMesBesoins(utilisateur).then(setBesoins);
    }, [utilisateur]);

    return (
        <Ecran titre="Mes annonces" retour="/services">
            <p className="soft">Les jeunes du quartier vous proposent leur aide ici.</p>
            <Link className="publier-rouge" to="/besoins/nouveau"><Icone nom="plus" /><span>Publier un besoin</span></Link>
            {besoins === null && <div className="squelettes">{[0, 1].map((i) => <span key={i} className="squelette" />)}</div>}
            {besoins && besoins.length === 0 && (
                <div className="vide"><span className="vide-icone"><Icone nom="plus" /></span><strong>Aucune annonce pour le moment.</strong><p>Décrivez votre besoin, les jeunes proches vous répondront.</p></div>
            )}
            <div className="liste-cartes">
                {besoins && besoins.map((b) => (
                    <CarteMonBesoin key={b.id} besoin={b} />
                ))}
            </div>
        </Ecran>
    );
};

export default MesBesoins;
