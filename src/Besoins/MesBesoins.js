import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSession } from "../composants/Session";
import { Ecran } from "../composants/Mise";
import { Icone } from "../composants/Icones";
import { mesBesoins, propositionsDuBesoin } from "../services/api";
import { STATUTS_BESOIN, depuis, iconeService, imageService, nomComplet, texteQuand } from "../services/constantes";

const MesBesoins = () => {
    const { utilisateur } = useSession();
    const [besoins, setBesoins] = useState(null);

    useEffect(() => {
        const charger = async () => {
            const liste = await mesBesoins(utilisateur);
            const avecNombre = await Promise.all(liste.map(async (b) => ({ ...b, propositions: (await propositionsDuBesoin(b.id).catch(() => [])).length })));
            setBesoins(avecNombre);
        };
        charger();
    }, [utilisateur]);

    return (
        <Ecran titre="Mes annonces" retour="/services">
            <p className="soft">Les jeunes du quartier vous proposent leur aide ici.</p>
            {besoins === null && <div className="squelettes">{[0, 1].map((i) => <span key={i} className="squelette" />)}</div>}
            {besoins && besoins.length === 0 && (
                <div className="vide"><span className="vide-icone"><Icone nom="plus" /></span><strong>Aucune annonce pour le moment.</strong><p>Décrivez votre besoin, les jeunes proches vous répondront.</p></div>
            )}
            <div className="liste-cartes">
                {besoins && besoins.map((b) => (
                    <Link key={b.id} to={`/besoins/${b.id}`} className="carte-profil carte-besoin">
                        <span className="carte-photo carte-service"><img src={imageService(b.service)} alt="" /><i><Icone nom={iconeService(b.service)} /></i></span>
                        <span className="carte-corps">
                            <span className="carte-ligne"><strong>{nomComplet(b.service, b.sousService)} pour {b.beneficiairePrenom}</strong></span>
                            <small>{depuis(b.creeAt)}{b.creneau || b.date ? ` · ${texteQuand(b.creneau, b.date)}` : ""}</small>
                            <span className="carte-bas"><em className={`statut ${b.statut === "OUVERTE" ? "ACCEPTEE" : "ANNULEE"}`}>{STATUTS_BESOIN[b.statut]}</em><em>{b.propositions} proposition{b.propositions > 1 ? "s" : ""}</em></span>
                        </span>
                        <Icone nom="chevron" />
                    </Link>
                ))}
            </div>
            <Link className="fab" to="/besoins/nouveau"><Icone nom="plus" /><span>Publier un besoin</span></Link>
        </Ecran>
    );
};

export default MesBesoins;
