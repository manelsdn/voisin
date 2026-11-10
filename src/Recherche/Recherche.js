import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useSession } from "../composants/Session";
import { CarteJeune, Message, Navigation, PucesServices } from "../composants/Mise";
import { Icone } from "../composants/Icones";
import CarteJeunes from "./CarteJeunes";
import Dictee from "../composants/Dictee";
import { analyser, resumer } from "../services/dictee";
import { besoinsProches, choisirPositionActuelle, classerJeunes, pointDeRecherche, prevenirLesJeunes, rechercherJeunes } from "../services/api";
import { JOURS, NOMS_JOURS, RAYONS, depuis, iconeService, imageService, nomComplet, nomService, texteDistance, texteJour, texteQuand } from "../services/constantes";

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
            <span className="carte-ligne"><strong>{nomComplet(besoin.service, besoin.sousService)} pour {besoin.beneficiairePrenom}</strong></span>
            <small>{texteDistance(besoin.distance)} · {besoin.ville} · {depuis(besoin.creeAt)}</small>
            <span className="carte-texte">{besoin.description}</span>
            {(besoin.creneau || besoin.date) && <span className="carte-bas"><em>{texteQuand(besoin.creneau, besoin.date)}</em></span>}
        </span>
        <Icone nom="chevron" />
    </Link>
);

export const PostBesoin = ({ besoin }) => (
    <article className="post post-compact carte-besoin">
        <Link className="post-head resultat" to={`/besoins/${besoin.id}`}>
            <img className="carte-photo" src={`/assets/services/plein/${besoin.service.toLowerCase()}.jpg`} alt="" />
            <span>
                <strong>{nomComplet(besoin.service, besoin.sousService)} pour {besoin.beneficiairePrenom}</strong>
                <small>{texteDistance(besoin.distance)} · {besoin.ville} · {depuis(besoin.creeAt)}</small>
                <em className="post-creneau">{besoin.creneau || besoin.date ? texteQuand(besoin.creneau, besoin.date) : "Créneau à convenir"}</em>
            </span>
        </Link>
        <p className="post-text">{besoin.description}</p>
        <div className="post-actions">
            <Link className="post-act" to={`/messages/${besoin.auteurId}`} aria-label={`Écrire à ${besoin.auteurPrenom}`}><Icone nom="message" /></Link>
            <Link className="post-cta" to={`/besoins/${besoin.id}`}>Proposer mon aide<Icone nom="heart" /></Link>
        </div>
    </article>
);

const TITRE_BESOIN = (b) => `${nomComplet(b.service, b.sousService)} pour ${b.beneficiairePrenom}`;
const DETAIL_BESOIN = (b) => [texteDistance(b.distance), b.ville, texteQuand(b.creneau, b.date)].filter(Boolean).join(" · ");
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
    const [texte, setTexte] = useState("");
    const [compris, setCompris] = useState(null);
    const [aide, setAide] = useState("");
    const [envoi, setEnvoi] = useState(false);

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
            const trouves = estJeune ? await besoinsProches(point.position, filtres) : await rechercherJeunes(point.position, filtres);
            const liste = !estJeune && compris ? await classerJeunes(trouves, compris) : trouves;
            if (!actif) return;
            setPour(point.personne);
            setPosition(point.actuelle ? point.position : point.personne);
            if (estJeune && utilisateur.positionActuelle && !point.actuelle) setRefus("Position indisponible pour le moment : on garde votre adresse.");
            setResultats(liste);
        };
        setResultats(null);
        charger();
        return () => { actif = false; };
    }, [utilisateur, filtres, estJeune, compris]);

    const chercher = (phrase) => {
        const c = analyser(phrase);
        if (!c.service && !c.jour) {
            setAide(estJeune ? "Je n'ai pas compris. Essayez par exemple : « courses samedi matin »." : "Je n'ai pas compris le service. Essayez par exemple : « un jeune pour mes courses demain matin ».");
            return;
        }
        setAide("");
        setCompris({ ...c, texte: phrase.trim() });
        setFiltres({ ...filtres, rayon: 2, service: c.service || "", jour: c.jour || "" });
    };

    const manuel = (suite) => {
        setCompris(null);
        setAide("");
        setFiltres(suite);
    };

    const prevenir = async () => {
        const besoin = compris || { service: filtres.service, jour: filtres.jour };
        if (!besoin.service) {
            setAide("Précisez le service, par exemple « mes courses », pour prévenir les jeunes.");
            return;
        }
        const texte = besoin.texte || `Je cherche un jeune pour ${nomService(besoin.service).toLowerCase()}${besoin.date ? ` le ${texteJour(besoin.date).toLowerCase()}` : besoin.jour ? ` le ${NOMS_JOURS[besoin.jour].toLowerCase()}` : ""}.`;
        setEnvoi(true);
        try {
            navigate(`/besoins/${await prevenirLesJeunes(utilisateur, besoin, texte)}`);
        } catch (err) {
            setAide(err.message);
            setEnvoi(false);
        }
    };

    const autresJours = () => {
        setCompris({ ...compris, jour: "", aujourdhui: false, heureDebut: "", heureFin: "", moment: "" });
        setFiltres({ ...filtres, jour: "" });
    };

    const lienJeune = (j) => {
        if (!compris || !j.creneau) return `/jeunes/${j.id}`;
        const suite = new URLSearchParams({ creneau: j.creneau.id });
        if (compris.service) suite.set("service", compris.service);
        if (compris.date && j.creneau.jour === compris.jour) suite.set("date", compris.date);
        return `/jeunes/${j.id}?${suite}`;
    };

    const ouvrirJeune = (j) => {
        try {
            if (compris) sessionStorage.setItem("vdo-assistant", compris.texte);
        } catch (e) {
            return;
        }
    };

    const choisirPosition = async (oui) => {
        setRefus("");
        const ok = await choisirPositionActuelle(utilisateur, oui);
        await recharger();
        if (!ok) setRefus("Le navigateur a bloqué la position : on garde votre adresse. Vous pouvez l'autoriser dans les réglages du navigateur.");
    };

    const changer = (champ) => (e) => manuel({ ...filtres, [champ]: champ === "rayon" ? Number(e.target.value) : e.target.value });
    const latitude = position ? position.latitude : null;
    const longitude = position ? position.longitude : null;
    const centre = useMemo(() => (latitude == null ? null : { latitude, longitude }), [latitude, longitude]);
    const ouvrir = useCallback((chemin) => navigate(chemin), [navigate]);
    const choix = estJeune ? utilisateur.positionActuelle : false;
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
                    {pour && estJeune && choix === undefined && (
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
                    {pour && estJeune && choix !== undefined && (
                        <label className="position-actuelle">
                            <input type="checkbox" checked={Boolean(choix)} onChange={() => choisirPosition(!choix)} />
                            <span>Utiliser ma position actuelle</span>
                        </label>
                    )}
                    {refus && <p className="position-refus" role="status">{refus}</p>}
                    <form className="recherche-carte" role="search" onSubmit={(e) => { e.preventDefault(); chercher(texte); }}>
                        <div className="recherche-carte-champ">
                            <button type="submit" className="recherche-loupe" aria-label="Chercher"><Icone nom="search" /></button>
                            <input type="search" aria-label={vue === "carte" ? "Rechercher sur la carte" : estJeune ? "Rechercher un besoin" : "Dites ce qu'il vous faut"} value={texte} onChange={(e) => setTexte(e.target.value)} placeholder={estJeune ? "Ex : courses samedi matin" : "Ex : courses demain matin"} enterKeyHint="search" autoFocus={params.get("assistant") === "1"} />
                            <Dictee compact ajouter={(t) => { setTexte(t); chercher(t); }} libelle="Le dire au micro" />
                        </div>
                        {compris && (
                            <p className="devine assistant-compris" aria-live="polite"><Icone nom="sparkles" /><span>J'ai compris : <b>{[compris.service && nomService(compris.service), compris.sous, resumer(compris)].filter(Boolean).join(" · ")}</b></span><button type="button" onClick={() => { setTexte(""); manuel({ ...filtres, service: "", jour: "" }); }}>Effacer</button></p>
                        )}
                        <Message erreur={aide} />
                    </form>
                    <div className="filtres-ligne filtres-rangee">
                        <label><span className="sr-only">Distance</span><select name="rayon" value={filtres.rayon} onChange={changer("rayon")}>{RAYONS.map((r) => <option key={r} value={r}>{"< "}{texteRayon(r)}</option>)}</select></label>
                        {!estJeune && <label><span className="sr-only">Disponibilité</span><select name="jour" value={filtres.jour} onChange={changer("jour")}><option value="">Tous les jours</option>{JOURS.map((j) => <option key={j} value={j}>{NOMS_JOURS[j]}</option>)}</select></label>}
                        <PucesServices actif={filtres.service} choisir={(code) => manuel({ ...filtres, service: code })} />
                    </div>
                </header>

                {resultats === null && <div className="squelettes" aria-label="Chargement">{[0, 1, 2, 3].map((i) => <span key={i} className="squelette" />)}</div>}
                {resultats && nombre === 0 && (
                    <div className="vide">
                        <span className="vide-icone"><Icone nom={estJeune ? "heart" : "search"} /></span>
                        <strong>{estJeune ? "Aucun besoin pour ces critères pour le moment." : compris ? `Personne n'est libre ${compris.aujourdhui ? "aujourd'hui" : compris.jour ? `le ${NOMS_JOURS[compris.jour].toLowerCase()}` : ""}${compris.service ? ` pour ${nomService(compris.service).toLowerCase()}` : ""}.` : "Personne pour ces critères pour le moment."}</strong>
                        <p>{estJeune ? "Élargissez la distance ou choisissez un autre service." : compris || filtres.service ? "Prévenez les jeunes du quartier : ceux qui peuvent vous proposeront leur aide." : "Élargissez la distance ou changez de jour."}</p>
                        {!estJeune && (compris || filtres.service) && <button type="button" className="primary" disabled={envoi} onClick={prevenir}>Prévenir les jeunes du quartier</button>}
                        {!estJeune && !compris && <Link className="secondary" to="/besoins/nouveau">Publier mon besoin</Link>}
                        {!estJeune && compris && compris.jour && <button type="button" className="secondary" onClick={autresJours}>Voir les autres jours</button>}
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
                        {estJeune ? resultats.map((b) => <PostBesoin key={b.id} besoin={b} />) : resultats.map((j) => <CarteJeune key={j.id} jeune={j} raisons={compris ? j.raisons : null} lien={lienJeune(j)} ouvrir={() => ouvrirJeune(j)} />)}
                        {!estJeune && compris && <button type="button" className="carte-publier" disabled={envoi} onClick={prevenir}><Icone nom="plus" /><span><strong>Personne ne vous convient ?</strong><small>Prévenez les jeunes du quartier, ils vous proposeront leur aide.</small></span></button>}
                    </div>
                )}
            </main>
            {!estJeune && vue === "liste" && <Link className="fab" to={filtres.service ? `/besoins/nouveau?service=${filtres.service}` : "/besoins/nouveau"}><Icone nom="plus" /><span>Publier un besoin</span></Link>}
            <Navigation />
        </div>
    );
};

export default Recherche;
