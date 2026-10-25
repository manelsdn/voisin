import { Link, NavLink, useNavigate } from "react-router-dom";
import { SERVICES } from "../services/constantes";
import { DessinService, Icone } from "./Icones";

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
        <div className="corps">
            <div className={`app-pad ${classe}`}>
                {retour && <Retour vers={retour} texte={surtitre} />}
                {!retour && surtitre && <span className="mini-eyebrow">{surtitre}</span>}
                {titre && <h2>{titre}</h2>}
                {children}
            </div>
        </div>
        {nav && <Navigation />}
    </div>
);

export const Navigation = () => (
    <nav className="bottom-nav" aria-label="Navigation principale">
        <NavLink to="/accueil"><Icone nom="home" />Accueil</NavLink>
        <NavLink to="/services"><Icone nom="calendar" />Services</NavLink>
        <NavLink to="/messages"><Icone nom="message" />Messages</NavLink>
        <NavLink to="/profil"><Icone nom="user" />Profil</NavLink>
    </nav>
);

export const Avatar = ({ personne, classe = "helper-photo" }) => {
    const prenom = (personne && personne.prenom) || "?";
    return personne && personne.photoProfil
        ? <img className={classe} src={personne.photoProfil} alt="" />
        : <b className={`${classe} initial-avatar`} aria-hidden="true">{prenom[0]}</b>;
};

export const BanniereService = ({ code }) => {
    const service = SERVICES.find((s) => s.code === code);
    if (!service) return null;
    return (
        <div className="service-banner">
            <DessinService code={code} />
            <img className="service-banner-img" src={`/assets/services/${code.toLowerCase()}.svg`} alt="" />
        </div>
    );
};

export const CartesServices = ({ lien, tous, actif }) => (
    <div className="story-bar" role="list" aria-label="Services">
        {tous && (
            <div role="listitem">
                <Link to={lien("")} className="story-btn" aria-pressed={!actif}>
                    <span className="story-ring"><span className="story-img"><img src="/assets/logo-voisin-dor-icone.svg" alt="" /></span></span>
                    <small>Tous</small>
                </Link>
            </div>
        )}
        {SERVICES.map((s) => (
            <div role="listitem" key={s.code}>
                <Link to={lien(s.code)} className="story-btn" aria-pressed={tous ? actif === s.code : false}>
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

export const Astuce = ({ icone = "heart", children }) => <p className="tip-note"><Icone nom={icone} /><span>{children}</span></p>;

export const Indice = ({ icone = "heart", children }) => <div className="hint"><Icone nom={icone} /><span>{children}</span></div>;
