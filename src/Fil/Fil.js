import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useSession } from "../composants/Session";
import { Avatar, CartesServices, Ecran, IconesServices } from "../composants/Mise";
import { Icone } from "../composants/Icones";
import { basculerFavori, besoinsProches, commentairesDuJeune, mesFavoris, pointDeRecherche, rechercherJeunes, tousLesCommentaires, tousLesLikes } from "../services/api";
import Commentaires from "./Commentaires";
import { depuis, nomService, texteCreneau, texteDistance } from "../services/constantes";

const moyenneAvis = (l) => (l.reduce((t, c) => t + (c.note || 5), 0) / l.length).toFixed(1).replace(".", ",");

const BoutonAvis = ({ liste, ouvert, id, basculer }) => (
    <button type="button" className={ouvert ? "post-act post-avis ouvert" : "post-act post-avis"} aria-expanded={ouvert} aria-controls={`coms-${id}`} aria-label={liste.length ? `Avis : ${moyenneAvis(liste)} sur 5, ${liste.length} avis` : "Avis"} onClick={() => basculer(id)}><Icone nom="star" /><span className="compte-like" aria-hidden="true">{liste.length ? `${moyenneAvis(liste)} (${liste.length})` : "Avis"}</span></button>
);

const FilAidants = ({ utilisateur, service }) => {
    const [besoins, setBesoins] = useState(null);
    const [avis, setAvis] = useState({});
    const [ouverts, setOuverts] = useState([]);

    useEffect(() => {
        const charger = async () => {
            const { position } = await pointDeRecherche(utilisateur);
            const trouves = await besoinsProches(position, { rayon: 2, service });
            setBesoins(trouves);
            setAvis(await tousLesCommentaires([...new Set(trouves.map((b) => b.beneficiaireId))]));
        };
        charger();
    }, [utilisateur, service]);

    const basculer = (id) => setOuverts((o) => (o.includes(id) ? o.filter((x) => x !== id) : [...o, id]));
    const maj = async (id) => {
        const liste = await commentairesDuJeune(id);
        setAvis((a) => ({ ...a, [id]: liste }));
    };

    return (
        <Ecran titre={<>Le fil <br />des voisins</>} retour="/accueil" classe="services-page feed-page">
            <p className="soft">Les personnes près de chez vous qui ont besoin d'un coup de main, de la plus proche à la plus loin.</p>
            <CartesServices tous actif={service} lien={(code) => (code ? `/fil?service=${code}` : "/fil")} />
            <div className="feed">
                {besoins === null && <p className="soft">Chargement…</p>}
                {besoins && besoins.length === 0 && <p className="soft">Pas de demande d'aide pour ce service autour de vous.</p>}
                {besoins && besoins.map((b) => {
                    const personne = { id: b.beneficiaireId, prenom: b.beneficiairePrenom, photoProfil: b.beneficiairePhoto, role: "SENIOR" };
                    const liste = avis[personne.id] || [];
                    const cle = `${b.id}-${personne.id}`;
                    const ouvert = ouverts.includes(cle);
                    return (
                        <article className="post post-compact carte-besoin" key={b.id}>
                            <Link className="post-head" to={`/voisins/${b.auteurId}`}>
                                <Avatar personne={personne} classe="carte-photo" />
                                <span><strong>{b.beneficiairePrenom}</strong><small>{texteDistance(b.distance)} · {b.ville} · {depuis(b.creeAt)}</small><em className="post-creneau">{b.creneau ? texteCreneau(b.creneau) : "Créneau à convenir"}</em></span>
                                <em className="post-tag">{nomService(b.service)}</em>
                            </Link>
                            <p className="post-text">{b.description}</p>
                            <div className="post-actions">
                                <BoutonAvis liste={liste} ouvert={ouvert} id={cle} basculer={basculer} />
                                <Link className="post-cta" to={`/besoins/${b.id}`}>Proposer mon aide<Icone nom="heart" /></Link>
                            </div>
                            <div id={`coms-${cle}`}>{ouvert && <Commentaires jeune={personne} utilisateur={utilisateur} liste={liste} notent="JEUNES" maj={() => maj(personne.id)} />}</div>
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
    const service = params.get("service") || "";
    const [jeunes, setJeunes] = useState(null);
    const [aimes, setAimes] = useState([]);
    const [likes, setLikes] = useState({});
    const [commentaires, setCommentaires] = useState({});
    const [ouverts, setOuverts] = useState([]);

    useEffect(() => {
        if (utilisateur.role === "JEUNE") return;
        const charger = async () => {
            const { position } = await pointDeRecherche(utilisateur);
            const trouves = (await rechercherJeunes(position, { rayon: 2, service })).filter((j) => j.id !== utilisateur.id && j.photoProfil);
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

    if (utilisateur.role === "JEUNE") return <FilAidants utilisateur={utilisateur} service={service} />;

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
                                <BoutonAvis liste={coms} ouvert={ouvert} id={j.id} basculer={basculer} />
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
