import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useSession } from "../composants/Session";
import { CarteJeune, Navigation, PucesServices } from "../composants/Mise";
import { Icone } from "../composants/Icones";
import CarteJeunes from "./CarteJeunes";
import { besoinsProches, pointDeRecherche, rechercherJeunes } from "../services/api";
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

const TITRE_BESOIN = (b) => `${nomService(b.service)} pour ${b.beneficiairePrenom}`;
const DETAIL_BESOIN = (b) => `${texteDistance(b.distance)} · ${b.ville}`;
const IMAGE_BESOIN = (b) => imageService(b.service);
const LIEN_BESOIN = (b) => `/besoins/${b.id}`;

const Recherche = () => {
    const { utilisateur } = useSession();
    const estJeune = utilisateur.role === "JEUNE";
    const [params] = useSearchParams();
    const navigate = useNavigate();
    const memo = lireMemo();
    const [filtres, setFiltres] = useState({ service: params.get("service") || memo.service || "", rayon: memo.rayon || (estJeune ? 5 : 2), jour: memo.jour || "" });
    const [vue, setVue] = useState(params.get("vue") === "carte" ? "carte" : "liste");
    const [pour, setPour] = useState(null);
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
            const { personne, position } = await pointDeRecherche(utilisateur);
            const liste = estJeune ? await besoinsProches(position, filtres) : await rechercherJeunes(position, filtres);
            if (!actif) return;
            setPour(personne);
            setResultats(liste);
        };
        setResultats(null);
        charger();
        return () => { actif = false; };
    }, [utilisateur, filtres, estJeune]);

    const changer = (champ) => (e) => setFiltres({ ...filtres, [champ]: champ === "rayon" ? Number(e.target.value) : e.target.value });
    const latitude = pour ? pour.latitude : null;
    const longitude = pour ? pour.longitude : null;
    const centre = useMemo(() => (latitude == null ? null : { latitude, longitude }), [latitude, longitude]);
    const ouvrir = useCallback((chemin) => navigate(chemin), [navigate]);
    const autour = pour ? (pour.id === utilisateur.id ? "chez vous" : `chez ${pour.prenom}`) : "";
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
                    {pour && <p className="explorer-lieu"><Icone nom="pin" /><span>Autour de {autour} · {pour.ville}</span>{resultats && <b className="compte" aria-live="polite">{nombre} {libelle}</b>}</p>}
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
                        <p className="legende-carte"><span><i style={{ background: "#FF6B5B" }}></i>{pour && pour.id !== utilisateur.id ? pour.prenom : "Vous"}</span><span><i style={{ background: "#1FAF98" }}></i>{estJeune ? "Besoins" : "Jeunes disponibles"} (position approximative)</span></p>
                    </div>
                )}

                {vue === "liste" && resultats && nombre > 0 && (
                    <div className="liste-cartes">
                        {estJeune ? resultats.map((b) => <CarteBesoin key={b.id} besoin={b} />) : resultats.map((j) => <CarteJeune key={j.id} jeune={j} />)}
                        {!estJeune && <Link className="carte-publier" to="/besoins/nouveau"><Icone nom="plus" /><span><strong>Vous ne trouvez pas ?</strong><small>Publiez votre besoin, les jeunes du quartier vous proposeront leur aide.</small></span></Link>}
                    </div>
                )}
                {!estJeune && vue === "carte" && <Link className="fab fab-rond" to="/besoins/nouveau" aria-label="Publier un besoin"><Icone nom="plus" /></Link>}
            </main>
            <Navigation />
        </div>
    );
};

export default Recherche;
