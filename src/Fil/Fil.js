import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useSession } from "../composants/Session";
import { Avatar, CartesServices, Ecran, IconesServices } from "../composants/Mise";
import { Icone } from "../composants/Icones";
import { basculerFavori, commentairesDuJeune, mesFavoris, pointDeRecherche, rechercherJeunes, tousLesCommentaires, tousLesLikes } from "../services/api";
import Commentaires from "./Commentaires";
import { nomService, texteCreneau, texteDistance } from "../services/constantes";

const Fil = () => {
    const { utilisateur } = useSession();
    const [params] = useSearchParams();
    const service = params.get("service") || "";
    const [jeunes, setJeunes] = useState(null);
    const [aimes, setAimes] = useState([]);
    const [likes, setLikes] = useState({});
    const [commentaires, setCommentaires] = useState({});
    const [ouverts, setOuverts] = useState([]);

    useEffect(() => {
        const charger = async () => {
            const { position } = await pointDeRecherche(utilisateur);
            const trouves = (await rechercherJeunes(position, { rayon: 5, service })).filter((j) => j.id !== utilisateur.id && j.photoProfil);
            setJeunes(trouves);
            setAimes(await mesFavoris(utilisateur).catch(() => []));
            setLikes(await tousLesLikes());
            setCommentaires(await tousLesCommentaires(trouves.map((j) => j.id)));
        };
        charger();
    }, [utilisateur, service]);

    const aimer = async (id) => {
        const deja = aimes.includes(id);
        setAimes(deja ? aimes.filter((x) => x !== id) : [...aimes, id]);
        setLikes((l) => ({ ...l, [id]: Math.max(0, (l[id] || 0) + (deja ? -1 : 1)) }));
        setAimes(await basculerFavori(utilisateur, id));
        setLikes(await tousLesLikes());
    };

    const basculer = (id) => setOuverts((o) => (o.includes(id) ? o.filter((x) => x !== id) : [...o, id]));
    const majCommentaires = async (id) => {
        const liste = await commentairesDuJeune(id);
        setCommentaires((c) => ({ ...c, [id]: liste }));
    };

    return (
        <Ecran titre={<>Le fil <br />du quartier</>} retour="/accueil" classe="services-page feed-page">
            <p className="soft">Les jeunes du quartier et ce qu’ils proposent, du plus proche au plus loin.</p>
            <CartesServices tous actif={service} lien={(code) => (code ? `/fil?service=${code}` : "/fil")} />
            <div className="feed">
                {jeunes === null && <p className="soft">Chargement…</p>}
                {jeunes && jeunes.length === 0 && <p className="soft">Pas encore de publication pour ce service.</p>}
                {jeunes && jeunes.map((j) => {
                    const principal = service || (j.services || [])[0];
                    const aime = aimes.includes(j.id);
                    const coms = commentaires[j.id] || [];
                    const ouvert = ouverts.includes(j.id);
                    return (
                        <article className="post post-compact" key={j.id}>
                            <Link className="post-head" to={`/jeunes/${j.id}`}>
                                <Avatar personne={j} classe="carte-photo" />
                                <span><strong>{j.prenom}</strong><small>{texteDistance(j.distance)}{j.disponibilites && j.disponibilites[0] ? ` · ${texteCreneau(j.disponibilites[0])}` : ""}</small><IconesServices services={j.services} /></span>
                                <em className="post-tag">{nomService(principal)}</em>
                            </Link>
                            <p className="post-text">{j.description || `Je propose un coup de main : ${(j.services || []).map(nomService).join(", ").toLowerCase()}.`}</p>
                            <div className="post-actions">
                                <button type="button" className={aime ? "post-act liked" : "post-act"} aria-pressed={aime} aria-label={aime ? `Retirer ${j.prenom} de mes favoris` : `Ajouter ${j.prenom} à mes favoris`} onClick={() => aimer(j.id)}><Icone nom="heart" />{likes[j.id] > 0 && <span className="compte-like" aria-hidden="true">{likes[j.id]}</span>}</button>
                                {likes[j.id] > 0 && <span className="sr-only">{likes[j.id]} j'aime</span>}
                                <button type="button" className={ouvert ? "post-act ouvert" : "post-act"} aria-expanded={ouvert} aria-controls={`coms-${j.id}`} aria-label={`Commentaires (${coms.length})`} onClick={() => basculer(j.id)}><Icone nom="message" />{coms.length > 0 && <span className="compte-like" aria-hidden="true">{coms.length}</span>}</button>
                                <Link className="post-cta" to={`/jeunes/${j.id}`}>Voir ses créneaux<Icone nom="arrow" /></Link>
                            </div>
                            <div id={`coms-${j.id}`}>{ouvert && <Commentaires jeune={j} utilisateur={utilisateur} liste={coms} maj={() => majCommentaires(j.id)} />}</div>
                        </article>
                    );
                })}
            </div>
        </Ecran>
    );
};

export default Fil;
