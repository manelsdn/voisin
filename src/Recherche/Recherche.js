import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useSession } from "../composants/Session";
import { CarteJeune, Navigation, PucesServices } from "../composants/Mise";
import { Icone } from "../composants/Icones";
import CarteJeunes from "./CarteJeunes";
import { besoinsProches, choisirPositionActuelle, pointDeRecherche, rechercherJeunes } from "../services/api";
import { JOURS, NOMS_JOURS, RAYONS, depuis, iconeService, imageService, nomService, texteCreneau, texteDistance } from "../services/constantes";

const CLE = "vdo-filtres";

const lireMemo = () => {
    try {
        return JSON.parse(sessionStorage.getItem(CLE) || "{}");
    } catch (e) {
        return {};
    }
};

const texteRayon = (r) => (r < 1 ? `${r * 1000} m` : `${r} km`);

export const CarteBesoin = ({ besoin }) => (
    <Link to={`/besoins/${besoin.id}`} className="carte-profil carte-besoin resultat">
        <span className="carte-photo carte-service"><img src={imageService(besoin.service)} alt="" /><i><Icone nom={iconeService(besoin.service)} /></i></span>
        <span className="carte-corps">
            <span className="carte-ligne"><strong>{nomService(besoin.service)} pour {besoin.beneficiairePrenom}</strong></span>
            <small>{texteDistance(besoin.distance)} · {besoin.ville} · {depuis(besoin.creeAt)}</small>
            <span className="carte-texte">{besoin.description}</span>
            {besoin.creneau && <span className="carte-bas"><em>{texteCreneau(besoin.creneau)}</em></span>}
        </span>
        <Icone nom="chevron" />
    </Link>
);

export const PostBesoin = ({ besoin }) => (
    <article className="post post-compact carte-besoin">
        <Link className="post-head resultat" to={`/besoins/${besoin.id}`}>
            <img className="carte-photo" src={`/assets/services/plein/${besoin.service.toLowerCase()}.jpg`} alt="" />
            <span>
                <strong>{nomService(besoin.service)} pour {besoin.beneficiairePrenom}</strong>
                <small>{texteDistance(besoin.distance)} · {besoin.ville} · {depuis(besoin.creeAt)}</small>
                <em className="post-creneau">{besoin.creneau ? texteCreneau(besoin.creneau) : "Créneau à convenir"}</em>
            </span>
        </Link>
        <p className="post-text">{besoin.description}</p>
        <div className="post-actions">
            <Link className="post-act" to={`/messages/${besoin.auteurId}`} aria-label={`Écrire à ${besoin.auteurPrenom}`}><Icone nom="message" /></Link>
            <Link className="post-cta" to={`/besoins/${besoin.id}`}>Proposer mon aide<Icone nom="heart" /></Link>
        </div>
    </article>
);

const TITRE_BESOIN = (b) => `${nomService(b.service)} pour ${b.beneficiairePrenom}`;
const DETAIL_BESOIN = (b) => `${texteDistance(b.distance)} · ${b.ville}`;
const IMAGE_BESOIN = (b) => imageService(b.service);
const LIEN_BESOIN = (b) => `/besoins/${b.id}`;

const Recherche = () => {
    const { utilisateur, recharger } = useSession();
    const estJeune = utilisateur.role === "JEUNE";
    const [params] = useSearchParams();
    const navigate = useNavigate();
    const memo = lireMemo();
    const [filtres, setFiltres] = useState({ service: params.get("service") || memo.service || "", rayon: RAYONS.includes(memo.rayon) ? memo.rayon : 2, jour: memo.jour || "" });
    const [vue, setVue] = useState(params.get("vue") === "carte" ? "carte" : "liste");
    const [pour, setPour] = useState(null);
    const [position, setPosition] = useState(null);
    const [refus, setRefus] = useState("");
    const [resultats, setResultats] = useState(null);

    useEffect(() => {
        try {
            sessionStorage.setItem(CLE, JSON.stringify(filtres));
        } catch (e) {
            return;
        }
    }, [filtres]);

    useEffect(() => {
        let actif = true;
        const charger = async () => {
            const point = await pointDeRecherche(utilisateur);
            const liste = estJeune ? await besoinsProches(point.position, filtres) : await rechercherJeunes(point.position, filtres);
            if (!actif) return;
            setPour(point.personne);
            setPosition(point.actuelle ? point.position : point.personne);
            if (utilisateur.positionActuelle && !point.actuelle) setRefus("Position indisponible pour le moment : on garde votre adresse.");
            setResultats(liste);
        };
        setResultats(null);
        charger();
        return () => { actif = false; };
    }, [utilisateur, filtres, estJeune]);

    const choisirPosition = async (oui) => {
        setRefus("");
        const ok = await choisirPositionActuelle(utilisateur, oui);
        await recharger();
        if (!ok) setRefus("Le navigateur a bloqué la position : on garde votre adresse. Vous pouvez l'autoriser dans les réglages du navigateur.");
    };

    const changer = (champ) => (e) => setFiltres({ ...filtres, [champ]: champ === "rayon" ? Number(e.target.value) : e.target.value });
    const latitude = position ? position.latitude : null;
    const longitude = position ? position.longitude : null;
    const centre = useMemo(() => (latitude == null ? null : { latitude, longitude }), [latitude, longitude]);
    const ouvrir = useCallback((chemin) => navigate(chemin), [navigate]);
    const choix = utilisateur.positionActuelle;
    const surPlace = Boolean(choix && position && position !== pour);
    const autour = pour ? (surPlace ? "votre position" : pour.id === utilisateur.id ? "chez vous" : `chez ${pour.prenom}`) : "";
    const nombre = resultats ? resultats.length : 0;
    const libelle = estJeune ? (nombre > 1 ? "besoins près de vous" : "besoin près de vous") : (nombre > 1 ? "jeunes disponibles" : "jeune disponible");

    return (
        <div className={`ecran vdo explorer${vue === "carte" ? " explorer-carte" : ""}`} id="vdo">
            <main className="corps">
                <header className="explorer-haut">
                    <div className="explorer-ligne">
                        <h1 className="explorer-titre">{estJeune ? "Aider près de chez vous" : "Trouver un jeune"}</h1>
                        <div className="bascule bascule-mini" role="group" aria-label="Affichage des résultats">
                            <button type="button" aria-pressed={vue === "liste"} onClick={() => setVue("liste")}><Icone nom="list" /><span className="sr-only">Liste</span></button>
                            <button type="button" aria-pressed={vue === "carte"} onClick={() => setVue("carte")}><Icone nom="map" /><span className="sr-only">Carte</span></button>
                        </div>
                    </div>
                    {pour && <p className="explorer-lieu"><Icone nom="pin" /><span>Autour de {autour}{surPlace ? "" : ` · ${pour.ville}`}</span>{resultats && <b className="compte" aria-live="polite">{nombre} {libelle}</b>}</p>}
                    {pour && choix === undefined && (
                        <div className="demande-position" role="group" aria-labelledby="titre-position">
                            <Icone nom="pin" />
                            <span>
                                <strong id="titre-position">Utiliser votre position actuelle ?</strong>
                                <small>Les distances partent de l'endroit où vous êtes, sans changer votre adresse. Votre position n'est pas enregistrée.</small>
                            </span>
                            <div className="demande-position-actions">
                                <button type="button" className="primary" onClick={() => choisirPosition(true)}>Autoriser</button>
                                <button type="button" className="secondary" onClick={() => choisirPosition(false)}>Refuser</button>
                            </div>
                        </div>
                    )}
                    {pour && choix !== undefined && (
                        <label className="position-actuelle">
                            <input type="checkbox" checked={Boolean(choix)} onChange={() => choisirPosition(!choix)} />
                            <span>Utiliser ma position actuelle</span>
                        </label>
                    )}
                    {refus && <p className="position-refus" role="status">{refus}</p>}
                    <PucesServices actif={filtres.service} choisir={(code) => setFiltres({ ...filtres, service: code })} />
                    <div className="filtres-ligne">
                        <label><span className="sr-only">Distance</span><select name="rayon" value={filtres.rayon} onChange={changer("rayon")}>{RAYONS.map((r) => <option key={r} value={r}>{"< "}{texteRayon(r)}</option>)}</select></label>
                        {!estJeune && <label><span className="sr-only">Disponibilité</span><select name="jour" value={filtres.jour} onChange={changer("jour")}><option value="">Tous les jours</option>{JOURS.map((j) => <option key={j} value={j}>{NOMS_JOURS[j]}</option>)}</select></label>}
                    </div>
                </header>

                {resultats === null && <div className="squelettes" aria-label="Chargement">{[0, 1, 2, 3].map((i) => <span key={i} className="squelette" />)}</div>}
                {resultats && nombre === 0 && (
                    <div className="vide">
                        <span className="vide-icone"><Icone nom={estJeune ? "heart" : "search"} /></span>
                        <strong>{estJeune ? "Aucun besoin pour ces critères pour le moment." : "Personne pour ces critères pour le moment."}</strong>
                        <p>{estJeune ? "Élargissez la distance ou choisissez un autre service." : "Élargissez la distance ou changez de jour."}</p>
                        {!estJeune && <Link className="secondary" to="/besoins/nouveau">Publier mon besoin</Link>}
                    </div>
                )}

                {vue === "carte" && centre && resultats && (
                    <div className="explorer-plan">
                        {estJeune
                            ? <CarteJeunes centre={centre} jeunes={resultats} rayon={filtres.rayon} ouvrir={ouvrir} lienVers={LIEN_BESOIN} titre={TITRE_BESOIN} detail={DETAIL_BESOIN} image={IMAGE_BESOIN} bouton="Voir l'annonce" region="Carte des besoins près de chez vous" />
                            : <CarteJeunes centre={centre} jeunes={resultats} rayon={filtres.rayon} ouvrir={ouvrir} />}
                    </div>
                )}

                {vue === "liste" && resultats && nombre > 0 && (
                    <div className={estJeune ? "liste-cartes feed" : "liste-cartes"}>
                        {estJeune ? resultats.map((b) => <PostBesoin key={b.id} besoin={b} />) : resultats.map((j) => <CarteJeune key={j.id} jeune={j} />)}
                        {!estJeune && <Link className="carte-publier" to="/besoins/nouveau"><Icone nom="plus" /><span><strong>Vous ne trouvez pas ?</strong><small>Publiez votre besoin, les jeunes du quartier vous proposeront leur aide.</small></span></Link>}
                    </div>
                )}
            </main>
            <Navigation />
        </div>
    );
};

export default Recherche;
