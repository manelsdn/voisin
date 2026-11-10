import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { ecouterMessages, nombreNonLus } from "../services/api";
import { SERVICES, creneauxActifs, etatService, iconeService, nomService, texteCreneau, texteDistance } from "../services/constantes";
import { texteDate } from "../services/geo";
import { DessinService, Icone } from "./Icones";
import { useSession } from "./Session";

export const Retour = ({ vers, texte, action }) => {
    const navigate = useNavigate();
    return (
        <div className="app-top">
            <button className="icon-btn" type="button" aria-label="Retour" onClick={() => (action ? action() : vers === true || !vers ? navigate(-1) : navigate(vers))}><Icone nom="back" /></button>
            {texte && <span className="step-text">{texte}</span>}
        </div>
    );
};

export const Ecran = ({ titre, retour, children, nav = true, surtitre, classe = "" }) => (
    <div className="ecran vdo" id="vdo">
        <main className="corps">
            <div className={`app-pad ${classe}`}>
                {retour && <Retour vers={retour} texte={surtitre} />}
                {!retour && surtitre && <span className="mini-eyebrow">{surtitre}</span>}
                {titre && <h1>{titre}</h1>}
                {children}
            </div>
        </main>
        {nav && <Navigation />}
    </div>
);

export const useNonLus = (utilisateur) => {
    const [nombre, setNombre] = useState(0);
    useEffect(() => {
        if (!utilisateur) return undefined;
        let actif = true;
        const maj = () => nombreNonLus(utilisateur).then((n) => actif && setNombre(n)).catch(() => {});
        maj();
        const arreter = ecouterMessages(utilisateur, maj);
        return () => {
            actif = false;
            arreter();
        };
    }, [utilisateur]);
    return nombre;
};

export const Navigation = () => {
    const session = useSession();
    const utilisateur = session && session.utilisateur;
    const estJeune = utilisateur && utilisateur.role === "JEUNE";
    const nonLus = useNonLus(utilisateur);
    return (
        <nav className="bottom-nav nav-5" aria-label="Navigation principale">
            <NavLink to="/accueil"><Icone nom="home" />Accueil</NavLink>
            <NavLink to="/services"><Icone nom="calendar" />{estJeune ? "Missions" : "Demandes"}</NavLink>
            <NavLink to="/recherche" className={({ isActive }) => (isActive ? "nav-centre active" : "nav-centre")} aria-label={estJeune ? "Aider : les besoins près de chez moi" : "Trouver un jeune près de chez moi"}>
                <span className="nav-centre-rond"><Icone nom={estJeune ? "heart" : "search"} /></span>{estJeune ? "Aider" : "Trouver"}
            </NavLink>
            <NavLink to="/messages" className="nav-messages"><Icone nom="message" />Messages{nonLus > 0 && <b className="nav-badge"><span className="sr-only">, </span>{nonLus > 9 ? "9+" : nonLus}<span className="sr-only"> non lus</span></b>}</NavLink>
            <NavLink to="/profil"><Icone nom="user" />Profil</NavLink>
        </nav>
    );
};

const TEINTES = ["#F6C7A1", "#E8B48A", "#C98B62", "#9A6544", "#F2D0B5"];
const CHEVEUX = ["#2A2140", "#5A3A26", "#8A5A32", "#C9872E", "#1E1A2B"];
const FONDS = ["#FFE8B8", "#CFF3EE", "#FFD4CC", "#E7DBFF", "#FDE2C4"];
const HABITS = ["#1FAF98", "#FF6B5B", "#9B6BFF", "#FFC145", "#3D7DD8"];
const COUPES = [
    "M26 40c0-14 9-22 22-22s22 8 22 22c-4-6-10-9-22-9s-18 3-22 9z",
    "M24 46c-2-18 8-30 24-30s26 12 24 30c-3-10-6-14-8-16-4 4-12 6-22 4-8 2-14 6-18 12z",
    "M24 52c-4-22 6-36 24-36s28 14 24 36l-4 14c0-12-2-24-4-28-6 4-14 6-20 4-6 2-12 4-16 10l-4 14z"
];

const graine = (texte) => [...String(texte || "?")].reduce((t, c) => (t * 31 + c.charCodeAt(0)) % 99991, 7);

export const svgAvatar = (personne) => {
    const g = graine((personne && (personne.id || personne.prenom)) || "?");
    const age = personne && personne.role === "SENIOR";
    const teinte = TEINTES[g % 5];
    const cheveux = age ? (g % 2 ? "#E9E4EE" : "#CFC8D6") : CHEVEUX[(g >> 2) % 5];
    const lunettes = age ? '<path d="M34 46a6 6 0 1 0 12 0a6 6 0 1 0 -12 0M50 46a6 6 0 1 0 12 0a6 6 0 1 0 -12 0M46 46h4" fill="none" stroke="#2A2140" stroke-width="2"/>' : "";
    return `<svg viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg"><rect width="96" height="96" rx="48" fill="${FONDS[(g >> 3) % 5]}"/><path d="M14 96c2-18 16-28 34-28s32 10 34 28z" fill="${HABITS[(g >> 4) % 5]}"/><rect x="41" y="56" width="14" height="14" rx="6" fill="${teinte}"/><ellipse cx="48" cy="44" rx="20" ry="22" fill="${teinte}"/><path d="${COUPES[(g >> 5) % 3]}" fill="${cheveux}"/>${lunettes}<circle cx="40" cy="46" r="2.4" fill="#2A2140"/><circle cx="56" cy="46" r="2.4" fill="#2A2140"/><path d="M41 55q7 6 14 0" fill="none" stroke="#2A2140" stroke-width="2.6" stroke-linecap="round"/><circle cx="34" cy="53" r="3.5" fill="#FF6B5B" opacity=".25"/><circle cx="62" cy="53" r="3.5" fill="#FF6B5B" opacity=".25"/></svg>`;
};

export const DessinAvatar = ({ personne, classe }) => (
    <span className={`${classe} avatar-dessin`} aria-hidden="true" dangerouslySetInnerHTML={{ __html: svgAvatar(personne) }} />
);

export const Avatar = ({ personne, classe = "helper-photo" }) =>
    personne && personne.photoProfil
        ? <img className={classe} src={personne.photoProfil} alt="" />
        : <DessinAvatar personne={personne} classe={classe} />;

export const IconesServices = ({ services = [], max = 4 }) => (
    <span className="icones-services" aria-hidden="true">
        {services.slice(0, max).map((c) => <i key={c} title={nomService(c)}><Icone nom={iconeService(c)} /></i>)}
    </span>
);

export const CarteJeune = ({ jeune, note, classe = "", raisons, lien, ouvrir }) => {
    const prochain = creneauxActifs(jeune.disponibilites)[0];
    return (
        <Link to={lien || `/jeunes/${jeune.id}`} onClick={ouvrir} className={`carte-profil resultat ${classe}`}>
            <Avatar personne={jeune} classe="carte-photo" />
            <span className="carte-corps">
                <span className="carte-ligne"><strong>{jeune.prenom}</strong>{note ? <span className="carte-note">★ {note}</span> : null}</span>
                <small>{texteDistance(jeune.distance)} · {(jeune.services || []).map(nomService).join(", ")}</small>
                {raisons && raisons.length > 0 ? <span className="carte-raisons">{raisons.map((r) => <em key={r}>{r}</em>)}</span> : (
                    <span className="carte-bas">
                        <IconesServices services={jeune.services} />
                        {prochain && <em>{texteCreneau(prochain)}</em>}
                    </span>
                )}
            </span>
            <Icone nom="chevron" />
        </Link>
    );
};

export const PucesServices = ({ actif, choisir, tous = true }) => (
    <div className="puces-services" role="group" aria-label="Filtrer par service">
        {tous && <button type="button" aria-pressed={!actif} onClick={() => choisir("")}><Icone nom="sparkles" />Tous</button>}
        {SERVICES.map((s) => <button key={s.code} type="button" aria-pressed={actif === s.code} onClick={() => choisir(s.code)}><Icone nom={iconeService(s.code)} />{s.nom}</button>)}
    </div>
);

export const BanniereService = ({ code }) => {
    const service = SERVICES.find((s) => s.code === code);
    if (!service) return null;
    return (
        <div className="service-banner">
            <DessinService code={code} />
            <img className="service-banner-img" src={service.banniere || `/assets/services/${code.toLowerCase()}.svg`} alt="" />
        </div>
    );
};

export const CartesServices = ({ lien, tous, actif }) => (
    <div className="story-bar" role="list" aria-label="Services">
        {tous && (
            <div role="listitem">
                <Link to={lien("")} className="story-btn" aria-current={!actif ? "true" : undefined}>
                    <span className="story-ring"><span className="story-img"><img src="/assets/logo-voisin-dor-icone.svg" alt="" /></span></span>
                    <small>Tous</small>
                </Link>
            </div>
        )}
        {SERVICES.map((s) => (
            <div role="listitem" key={s.code}>
                <Link to={lien(s.code)} className="story-btn" aria-current={tous && actif === s.code ? "true" : undefined}>
                    <span className="story-ring"><span className="story-img"><img src={s.image} alt="" /></span></span>
                    <small>{s.nom}</small>
                </Link>
            </div>
        ))}
    </div>
);

export const Message = ({ erreur, info }) => (
    <>
        {erreur && <p className="erreur" role="alert">{erreur}</p>}
        {info && <p className="info" role="status">{info}</p>}
    </>
);

export const LienBouton = ({ to, children, secondaire, fleche }) => (
    <Link className={secondaire ? "secondary" : "primary"} to={to}>
        {fleche ? <><span>{children}</span><Icone nom="arrow" /></> : children}
    </Link>
);

const HEURES = Array.from({ length: 31 }, (_, i) => `${String(7 + Math.floor(i / 2)).padStart(2, "0")}:${i % 2 ? "30" : "00"}`);

export const ChoixHeure = ({ libelle, name, value, onChange, disabled }) => (
    <label>{libelle}<select name={name} aria-label={libelle} value={value} disabled={disabled} onChange={onChange}><option value="">--:--</option>{[...new Set([...HEURES, ...(value ? [value] : [])])].sort().map((h) => <option key={h} value={h}>{h.replace(":", "h")}</option>)}</select></label>
);

export const Astuce = ({ icone = "heart", children }) => <p className="tip-note"><Icone nom={icone} /><span>{children}</span></p>;

export const Indice = ({ icone = "heart", children }) => <div className="hint"><Icone nom={icone} /><span>{children}</span></div>;

const ETAPES = ["Envoyée", "Acceptée", "Terminée"];
const RANG = { ENVOYEE: 0, ACCEPTEE: 1, TERMINEE: 2 };

export const Etapes = ({ statut }) => {
    if (RANG[statut] === undefined) return null;
    return (
        <ol className="suivi" aria-label="Avancement">
            {ETAPES.map((e, i) => (
                <li key={e} className={i < RANG[statut] || statut === "TERMINEE" ? "fait" : i === RANG[statut] ? "actuel" : ""} aria-current={i === RANG[statut] ? "step" : undefined}>
                    <span className="etape-rond">{i < RANG[statut] || statut === "TERMINEE" ? <Icone nom="check" /> : i + 1}</span>{e}
                </li>
            ))}
        </ol>
    );
};

export const EtatService = ({ statut, estJeune }) => <em className={`statut ${statut}${estJeune && statut === "ENVOYEE" ? " a-faire" : ""}`}>{etatService(statut, estJeune)}</em>;

export const prochaineEtape = (d, estJeune, avis, court) => {
    const jour = d.dateSouhaitee ? texteDate(d.dateSouhaitee) : "";
    const autre = estJeune ? d.demandeurPrenom : d.jeunePrenom;
    if (d.statut === "ENVOYEE") return estJeune ? "Lisez la demande, puis appuyez sur « Accepter » ou « Refuser »." : `${autre} doit répondre. Vous recevrez un message dès sa réponse.`;
    if (d.statut === "ACCEPTEE") return estJeune ? `Rendez-vous ${jour ? `le ${jour}` : "bientôt"} chez ${d.beneficiairePrenom}. ${court ? "" : "Une fois l'aide faite, appuyez sur « Service terminé »."}` : `${autre} viendra ${jour ? `le ${jour}` : "bientôt"}.${court ? "" : " Son numéro est affiché juste au-dessus."}`;
    if (d.statut === "TERMINEE") return !estJeune && !avis ? `C'est fait ! Laissez un avis pour remercier ${autre}.` : "C'est fait. Merci pour ce coup de main !";
    if (d.statut === "REFUSEE") return estJeune ? "Vous avez refusé cette demande." : `${autre} n'est pas disponible. Vous pouvez choisir un autre jeune.`;
    return "Cette demande a été annulée.";
};
