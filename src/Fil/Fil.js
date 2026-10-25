import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useSession } from "../composants/Session";
import { Avatar, CartesServices, Ecran } from "../composants/Mise";
import { Icone } from "../composants/Icones";
import { basculerFavori, mesFavoris, pointDeRecherche, rechercherJeunes } from "../services/api";
import { ROLES, imageService, nomService, texteCreneau, texteDistance } from "../services/constantes";

const IMAGES_FIL = { "lucas.png": "/assets/fil/lucas.jpg", "ines.png": "/assets/fil/ines.jpg", "adam.png": "/assets/fil/adam.jpg" };

const imagePublication = (jeune, service) => {
    const fichier = (jeune.photoProfil || "").split("/").pop();
    return IMAGES_FIL[fichier] || imageService(service);
};

const Fil = () => {
    const { utilisateur } = useSession();
    const [params] = useSearchParams();
    const service = params.get("service") || "";
    const [jeunes, setJeunes] = useState(null);
    const [aimes, setAimes] = useState([]);

    useEffect(() => {
        const charger = async () => {
            const { position } = await pointDeRecherche(utilisateur);
            setJeunes((await rechercherJeunes(position, { rayon: 5, service })).filter((j) => j.id !== utilisateur.id));
            setAimes(await mesFavoris(utilisateur).catch(() => []));
        };
        charger();
    }, [utilisateur, service]);

    const aimer = async (id) => {
        setAimes(aimes.includes(id) ? aimes.filter((x) => x !== id) : [...aimes, id]);
        setAimes(await basculerFavori(utilisateur, id));
    };

    return (
        <Ecran titre={<>Le fil <br />du quartier</>} retour="/accueil" classe="services-page feed-page">
            <p className="soft">Les annonces des jeunes, du plus proche au plus loin.</p>
            <CartesServices tous actif={service} lien={(code) => (code ? `/fil?service=${code}` : "/fil")} />
            <div className="feed">
                {jeunes === null && <p className="soft">Chargement…</p>}
                {jeunes && jeunes.length === 0 && <p className="soft">Pas encore de publication pour ce service.</p>}
                {jeunes && jeunes.map((j) => {
                    const principal = service || (j.services || [])[0];
                    return (
                        <article className="post" key={j.id}>
                            <header className="post-head">
                                <Avatar personne={j} classe="post-avatar" />
                                <span><strong>{j.prenom}</strong><small>{ROLES.JEUNE} · {texteDistance(j.distance)}{j.disponibilites && j.disponibilites[0] ? ` · ${texteCreneau(j.disponibilites[0])}` : ""}</small></span>
                                <em className="post-tag">{nomService(principal)}</em>
                            </header>
                            <img className="post-img" src={imagePublication(j, principal)} alt={`${j.prenom} propose son aide`} loading="lazy" />
                            <p className="post-text"><strong>{j.prenom}</strong> {j.description || `Je propose un coup de main : ${(j.services || []).map(nomService).join(", ").toLowerCase()}.`}</p>
                            <div className="post-actions">
                                <button type="button" className={aimes.includes(j.id) ? "post-act liked" : "post-act"} aria-pressed={aimes.includes(j.id)} aria-label={aimes.includes(j.id) ? `Retirer ${j.prenom} de mes favoris` : `Ajouter ${j.prenom} à mes favoris`} onClick={() => aimer(j.id)}><Icone nom="heart" /></button>
                                <Link className="post-act" to={`/messages/${j.id}`} aria-label={`Écrire à ${j.prenom}`}><Icone nom="message" /></Link>
                                <Link className="post-cta" to={`/jeunes/${j.id}`}>Voir ses créneaux<Icone nom="arrow" /></Link>
                            </div>
                        </article>
                    );
                })}
            </div>
        </Ecran>
    );
};

export default Fil;
