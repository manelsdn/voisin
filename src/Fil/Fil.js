import { useEffect, useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { useSession } from "../composants/Session";
import { Avatar, CartesServices, Ecran } from "../composants/Mise";
import { Icone } from "../composants/Icones";
import { besoinsProches, pointDeRecherche } from "../services/api";
import { depuis, nomComplet, texteDistance, texteQuand } from "../services/constantes";

const FilAidants = ({ utilisateur, service }) => {
    const [besoins, setBesoins] = useState(null);

    useEffect(() => {
        const charger = async () => {
            const { position } = await pointDeRecherche(utilisateur);
            setBesoins(await besoinsProches(position, { rayon: 2, service }));
        };
        charger();
    }, [utilisateur, service]);

    return (
        <Ecran titre={<>Le fil <br />des voisins</>} retour="/accueil" classe="services-page feed-page">
            <p className="soft">Les personnes près de chez vous qui ont besoin d'un coup de main, de la plus proche à la plus loin.</p>
            <CartesServices tous actif={service} lien={(code) => (code ? `/fil?service=${code}` : "/fil")} />
            <div className="feed">
                {besoins === null && <p className="soft">Chargement…</p>}
                {besoins && besoins.length === 0 && <p className="soft">Pas de demande d'aide pour ce service autour de vous.</p>}
                {besoins && besoins.map((b) => {
                    const personne = { id: b.beneficiaireId, prenom: b.beneficiairePrenom, photoProfil: b.beneficiairePhoto, role: "SENIOR" };
                    return (
                        <article className="post post-compact carte-besoin" key={b.id}>
                            <Link className="post-head" to={`/voisins/${b.auteurId}`}>
                                <Avatar personne={personne} classe="carte-photo" />
                                <span><strong>{b.beneficiairePrenom}</strong><small>{texteDistance(b.distance)} · {b.ville} · {depuis(b.creeAt)}</small><em className="post-creneau">{b.creneau || b.date ? texteQuand(b.creneau, b.date) : "Créneau à convenir"}</em></span>
                                <em className="post-tag">{nomComplet(b.service, b.sousService)}</em>
                            </Link>
                            <p className="post-text">{b.description}</p>
                            <div className="post-actions">
                                <Link className="post-cta" to={`/besoins/${b.id}`}>Proposer mon aide<Icone nom="heart" /></Link>
                            </div>
                        </article>
                    );
                })}
            </div>
        </Ecran>
    );
};

const Fil = () => {
    const { utilisateur } = useSession();
    const [params] = useSearchParams();
    if (utilisateur.role !== "JEUNE") return <Navigate to="/recherche" replace />;
    return <FilAidants utilisateur={utilisateur} service={params.get("service") || ""} />;
};

export default Fil;
