import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSession } from "../composants/Session";
import { Astuce, Avatar, CartesServices, Navigation } from "../composants/Mise";
import { Icone } from "../composants/Icones";
import { mesDemandes, pointDeRecherche, rechercherJeunes } from "../services/api";
import { ROLES, STATUTS, imageService, nomService, texteCreneau, texteDistance } from "../services/constantes";

const CarteQuartier = ({ ville }) => (
    <div className="browse-map" role="img" aria-label="Carte du quartier avec les personnes disponibles à proximité">
        <span className="map-badge"><Icone nom="pin" />Carte du quartier</span>
        <img className="browse-map-photo" src="/assets/carte-quartier.jpg" alt="" />
        <span className="map-caption"><i style={{ background: "#FFC145" }}></i>Vous <i style={{ background: "#1FAF98" }}></i>Disponibles près de {ville}</span>
    </div>
);

const Accueil = () => {
    const { utilisateur } = useSession();
    const [proche, setProche] = useState(null);
    const [suggestions, setSuggestions] = useState(null);
    const estJeune = utilisateur.role === "JEUNE";
    const ville = (proche && proche.ville) || utilisateur.ville;

    useEffect(() => {
        const charger = async () => {
            if (estJeune) {
                const demandes = await mesDemandes(utilisateur);
                setSuggestions(demandes.filter((d) => d.statut === "ENVOYEE"));
            } else {
                const { personne, position } = await pointDeRecherche(utilisateur);
                if (personne.id !== utilisateur.id) setProche(personne);
                setSuggestions((await rechercherJeunes(position, { rayon: 2 })).slice(0, 3));
            }
        };
        charger();
    }, [utilisateur, estJeune]);

    const titre = estJeune ? <>Prêt à donner <br /><em>un coup de main</em> ?</> : <>Petits services, <br /><em>grands liens.</em></>;

    return (
        <div className="ecran vdo accueil-compact" id="vdo">
            <div className="corps">
                <div className="home-top">
                    <Link className="location-button" to={utilisateur.role === "ACCOMPAGNANT" ? "/proche" : "/modifier-profil"} aria-label={`Mon quartier : ${ville}`}><Icone nom="pin" />{ville}<Icone nom="down" /></Link>
                    <Link className="avatar" to="/profil" aria-label="Mon profil"><Avatar personne={utilisateur} classe="mini-persona-photo" /></Link>
                </div>
                <div className="home-content modern-home">
                    <div className="bonjour-ligne"><span className="greeting">Bonjour {utilisateur.prenom}</span><span className="role-badge">{ROLES[utilisateur.role]}</span></div>
                    <h2 className="titre-accent">{titre}</h2>
                    {utilisateur.role === "ACCOMPAGNANT" && (
                        <Link className="beneficiary" to="/proche">
                            <Icone nom="users" />
                            {proche && proche.photoProfil && <img className="badge-persona-photo" src={proche.photoProfil} alt="" />}
                            <span>{proche ? <>Pour <strong>{proche.prenom}</strong>, votre proche</> : "Ajouter la personne que vous accompagnez"}</span>
                            <span className="chevron"><Icone nom="down" /></span>
                        </Link>
                    )}
                    <div className="hero-photo">
                        <img src={estJeune ? "/assets/presentation/ensemble.jpg" : "/assets/presentation/accueil.jpg"} alt="" />
                        <div className="hero-photo-texte">
                            <span className="mini-eyebrow">{estJeune ? "MON ANNONCE" : "MON QUARTIER"}</span>
                            <strong>{estJeune ? (utilisateur.annoncePubliee ? "Votre annonce est en ligne." : "Publiez vos créneaux.") : "Des jeunes disponibles près de vous."}</strong>
                        </div>
                    </div>
                    <div className="section-title">
                        <h3>{estJeune ? "Vos services" : "Un coup de main pour…"}</h3>
                        <Link className="see-all" to="/fil">Le fil<Icone nom="chevron" /></Link>
                    </div>
                    <CartesServices lien={(code) => (estJeune ? "/annonce" : `/recherche?service=${code}`)} />
                    {!estJeune && (
                        <Link className="map-preview-card carte-grande" to="/recherche?vue=carte" aria-label="Voir les jeunes disponibles sur la carte">
                            <CarteQuartier ville={ville} />
                            <span className="carte-bouton"><Icone nom="pin" />Ouvrir la carte</span>
                        </Link>
                    )}
                    <div className="section-title">
                        <h3>{estJeune ? "Demandes reçues" : "Près de chez vous"}</h3>
                        <Link className="see-all" to={estJeune ? "/services" : "/recherche"}>Tout voir<Icone nom="chevron" /></Link>
                    </div>
                    {suggestions === null && <p className="soft">Chargement…</p>}
                    {suggestions && suggestions.length === 0 && <div className="notice">{estJeune ? "Aucune demande pour le moment." : "Personne à moins de 2 km pour le moment."}</div>}
                    <div className="liste-compacte">
                        {suggestions && estJeune && suggestions.map((d) => (
                            <Link key={d.id} to={`/demandes/${d.id}`} className="helper-card helper-card-rich">
                                <img className="helper-photo" src={imageService(d.service)} alt="" />
                                <span>
                                    <strong>{d.beneficiairePrenom} · {nomService(d.service)}</strong>
                                    <small>{texteDistance(d.distanceKm)} · {texteCreneau(d.creneau)}</small>
                                    <span className="slot-row"><em>{STATUTS[d.statut]}</em></span>
                                </span>
                                <Icone nom="chevron" />
                            </Link>
                        ))}
                        {suggestions && !estJeune && suggestions.map((j) => (
                            <Link key={j.id} to={`/jeunes/${j.id}`} className="helper-card helper-card-rich">
                                <Avatar personne={j} />
                                <span>
                                    <strong>{j.prenom} <small className="inline">· {texteDistance(j.distance)}</small></strong>
                                    <small>{(j.services || []).map(nomService).join(" · ")}</small>
                                    <span className="slot-row">{(j.disponibilites || []).slice(0, 1).map((c) => <em key={c.id}>{texteCreneau(c)}</em>)}</span>
                                </span>
                                <Icone nom="chevron" />
                            </Link>
                        ))}
                    </div>
                    <Astuce>Pourboire libre, directement entre vous.</Astuce>
                </div>
            </div>
            {estJeune
                ? <Link className="fab" to="/annonce"><Icone nom="sparkles" /><span>{utilisateur.annoncePubliee ? "Modifier mon annonce" : "Publier mon annonce"}</span></Link>
                : <Link className="fab" to="/recherche"><Icone nom="users" /><span>Trouver de l'aide</span></Link>}
            <Navigation />
        </div>
    );
};

export default Accueil;
