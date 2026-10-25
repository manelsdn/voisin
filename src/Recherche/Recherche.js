import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useSession } from "../composants/Session";
import { Avatar, Ecran } from "../composants/Mise";
import { Icone } from "../composants/Icones";
import CarteJeunes from "./CarteJeunes";
import { pointDeRecherche, rechercherJeunes } from "../services/api";
import { JOURS, NOMS_JOURS, RAYONS, SERVICES, nomService, texteCreneau, texteDistance } from "../services/constantes";

const CLE = "vdo-filtres";

const EXEMPLES = {
    COURSES: [["shopping-cart", "Épicerie"], ["apple", "Fruits & légumes"], ["croissant", "Boulangerie"], ["milk", "Produits frais"]],
    MENAGE: [["clean", "Nettoyage"], ["washing-machine", "Linge"], ["sparkles", "Rangement"]],
    BRICOLAGE: [["tool", "Réparation"], ["tool", "Montage meuble"], ["drill", "Perçage"]],
    INFORMATIQUE: [["laptop", "Ordinateur"], ["smartphone", "Téléphone"], ["printer", "Imprimante"]],
    JARDINAGE: [["leaf", "Fleurs"], ["trees", "Arbustes"], ["sprout", "Semis"]],
    CUISINE: [["pot", "Plat mijoté"], ["utensils-crossed", "Repas"], ["chef-hat", "Recette"], ["cake", "Pâtisserie"]]
};

const Recherche = () => {
    const { utilisateur } = useSession();
    const [params] = useSearchParams();
    const navigate = useNavigate();
    const memo = JSON.parse(sessionStorage.getItem(CLE) || "{}");
    const [filtres, setFiltres] = useState({ service: params.get("service") || memo.service || "", rayon: memo.rayon || 2, jour: memo.jour || "" });
    const [vue, setVue] = useState(params.get("vue") === "carte" ? "carte" : "liste");
    const [pour, setPour] = useState(null);
    const [resultats, setResultats] = useState(null);

    useEffect(() => {
        sessionStorage.setItem(CLE, JSON.stringify(filtres));
        const charger = async () => {
            const { personne, position } = await pointDeRecherche(utilisateur);
            setPour(personne);
            setResultats(await rechercherJeunes(position, filtres));
        };
        charger();
    }, [utilisateur, filtres]);

    const changer = (champ) => (e) => setFiltres({ ...filtres, [champ]: champ === "rayon" ? Number(e.target.value) : e.target.value });
    const latitude = pour ? pour.latitude : null;
    const longitude = pour ? pour.longitude : null;
    const centre = useMemo(() => (latitude == null ? null : { latitude, longitude }), [latitude, longitude]);
    const ouvrir = useCallback((id) => navigate(`/jeunes/${id}`), [navigate]);

    return (
        <Ecran titre={<>Des mains tendues, <br />près de vous.</>} retour="/accueil">
            {pour && <p className="soft">Autour de l'adresse de {pour.id === utilisateur.id ? "chez vous" : pour.prenom} · {pour.ville} · triés du plus proche au plus éloigné</p>}
            {filtres.service && EXEMPLES[filtres.service] && (
                <div className="story-reel" aria-label={`Exemples pour ${nomService(filtres.service)}`}>
                    {EXEMPLES[filtres.service].map(([icone, texte]) => (
                        <div className="story-item" key={texte}><span className="story-circle"><Icone nom={icone} /></span><small>{texte}</small></div>
                    ))}
                </div>
            )}
            <div className="form-stack">
                <label>Type de service<select name="service" value={filtres.service} onChange={changer("service")}><option value="">Tous</option>{SERVICES.map((s) => <option key={s.code} value={s.code}>{s.nom}</option>)}</select></label>
                <label>Distance<select name="rayon" value={filtres.rayon} onChange={changer("rayon")}>{RAYONS.map((r) => <option key={r} value={r}>À moins de {r < 1 ? r * 1000 + " m" : r + " km"}</option>)}</select></label>
                <label>Disponibilité<select name="jour" value={filtres.jour} onChange={changer("jour")}><option value="">Tous les jours</option>{JOURS.map((j) => <option key={j} value={j}>{NOMS_JOURS[j]}</option>)}</select></label>
            </div>
            <div className="bascule" role="group" aria-label="Affichage des résultats">
                <button type="button" aria-pressed={vue === "liste"} onClick={() => setVue("liste")}><Icone nom="filter" />Liste</button>
                <button type="button" aria-pressed={vue === "carte"} onClick={() => setVue("carte")}><Icone nom="pin" />Carte</button>
            </div>
            {resultats === null && <p className="soft">Recherche…</p>}
            {resultats && <p className="compte" aria-live="polite">{resultats.length} {resultats.length > 1 ? "jeunes disponibles" : "jeune disponible"}</p>}
            {resultats && resultats.length === 0 && <div className="notice">Personne pour ces critères pour le moment. Élargissez la distance ou changez de jour.</div>}
            {vue === "carte" && centre && resultats && (
                <>
                    <CarteJeunes centre={centre} jeunes={resultats} rayon={filtres.rayon} ouvrir={ouvrir} />
                    <p className="legende-carte"><span><i style={{ background: "#FF6B5B" }}></i>{pour && pour.id !== utilisateur.id ? pour.prenom : "Vous"}</span><span><i style={{ background: "#1FAF98" }}></i>Jeunes disponibles (position approximative)</span></p>
                </>
            )}
            {vue === "liste" && (
                <div className="stack-actions">
                    {resultats && resultats.map((j) => (
                        <Link key={j.id} to={`/jeunes/${j.id}`} className="helper-card helper-card-rich resultat">
                            <Avatar personne={j} />
                            <span>
                                <strong>{j.prenom}</strong>
                                <small>{texteDistance(j.distance)} · {(j.services || []).map(nomService).join(", ")}</small>
                                <span className="slot-row">{(j.disponibilites || []).slice(0, 2).map((c) => <em key={c.id}>{texteCreneau(c)}</em>)}</span>
                            </span>
                            <Icone nom="chevron" />
                        </Link>
                    ))}
                </div>
            )}
        </Ecran>
    );
};

export default Recherche;
