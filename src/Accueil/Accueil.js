import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSession } from "../composants/Session";
import { Astuce, Avatar, CartesServices, LienBouton, Navigation } from "../composants/Mise";
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

    const titre = estJeune ? <>Des demandes <br />près de vous.</> : utilisateur.role === "SENIOR" ? <>De l'aide simple, <br />quand vous voulez.</> : <>Organiser une aide, <br />sans stress.</>;

    return (
        <div className="ecran vdo" id="vdo">
            <div className="corps">
                <div className="home-top">
                    <Link className="location-button" to={utilisateur.role === "ACCOMPAGNANT" ? "/proche" : "/modifier-profil"} aria-label={`Mon quartier : ${ville}`}><Icone nom="pin" />{ville}<Icone nom="down" /></Link>
                    <Link className="avatar" to="/profil" aria-label="Mon profil"><Avatar personne={utilisateur} classe="mini-persona-photo" /></Link>
                </div>
                <div className="home-content modern-home">
                    <div className="bonjour-ligne"><span className="greeting">Bonjour {utilisateur.prenom}</span><span className="role-badge">{ROLES[utilisateur.role]}</span></div>
                    <h2>{titre}</h2>
                    {utilisateur.role === "ACCOMPAGNANT" && (
                        <Link className="beneficiary" to="/proche">
                            <Icone nom="users" />
                            {proche && proche.photoProfil && <img className="badge-persona-photo" src={proche.photoProfil} alt="" />}
                            <span>{proche ? <>Pour <strong>{proche.prenom}</strong>, votre proche</> : "Ajouter la personne que vous accompagnez"}</span>
                            <span className="chevron"><Icone nom="down" /></span>
                        </Link>
                    )}
                    <div className="hero-card hero-card-modern">
                        <div>
                            <span className="mini-eyebrow">{estJeune ? "JE PROPOSE MES CRÉNEAUX" : "MON QUARTIER"}</span>
                            <h3>{estJeune ? <>Vous choisissez <br />vos horaires.</> : <>Des voisins <br />disponibles.</>}</h3>
                            <p>{estJeune ? (utilisateur.annoncePubliee ? "Votre annonce est en ligne. Les personnes voient vos créneaux, puis vous confirmez ensemble." : "Publiez votre annonce : les personnes voient vos créneaux, puis vous confirmez ensemble.") : utilisateur.role === "SENIOR" ? "Vous pouvez demander vous-même, ou avec un proche." : "Vous voyez les jeunes proches et leurs disponibilités."}</p>
                        </div>
                        <img src={estJeune ? (utilisateur.photoProfil || "/assets/illustration-rencontre-perron.png") : "/assets/illustration-mamie.png"} alt="" />
                    </div>
                    {estJeune && <LienBouton to="/annonce" fleche>{utilisateur.annoncePubliee ? "Modifier mon annonce" : "Publier mon annonce"}</LienBouton>}
                    <div className="section-title">
                        <h3>{estJeune ? "Quel service proposer ?" : "Un coup de main pour…"}</h3>
                        <Link className="see-all" to="/fil">Le fil<Icone nom="chevron" /></Link>
                    </div>
                    <CartesServices lien={(code) => (estJeune ? "/annonce" : `/recherche?service=${code}`)} />
                    <div className="section-title">
                        <h3>{estJeune ? "Demandes reçues" : "Des jeunes près de vous"}</h3>
                        <Link className="see-all" to={estJeune ? "/services" : "/recherche"}>Tout voir<Icone nom="chevron" /></Link>
                    </div>
                    {!estJeune && (
                        <Link className="map-preview-card" to="/recherche?vue=carte" aria-label="Voir les jeunes disponibles sur la carte">
                            <CarteQuartier ville={ville} />
                            <strong>Voir les jeunes disponibles</strong>
                            <small>{ville} · services triés par proximité</small>
                        </Link>
                    )}
                    <div className="suggestion-block">
                        <span>{estJeune ? "Demandes en attente de votre réponse" : "Personnes suggérées près de chez vous"}</span>
                        <small>{estJeune ? "Acceptez ou refusez : la personne est prévenue tout de suite." : "Selon votre quartier et les créneaux proposés, à moins de 2 km."}</small>
                    </div>
                    {suggestions === null && <p className="soft">Chargement…</p>}
                    {suggestions && suggestions.length === 0 && <div className="notice">{estJeune ? "Aucune demande pour le moment." : "Personne n'est disponible à moins de 2 km pour le moment."}</div>}
                    <div className="stack-actions">
                        {suggestions && estJeune && suggestions.map((d) => (
                            <Link key={d.id} to={`/demandes/${d.id}`} className="helper-card helper-card-rich">
                                <img className="helper-photo" src={imageService(d.service)} alt="" />
                                <span>
                                    <strong>{d.beneficiairePrenom} · {nomService(d.service)}</strong>
                                    <small>{texteDistance(d.distanceKm)} · {d.beneficiaireId !== d.demandeurId ? `demande organisée par ${d.demandeurPrenom}` : "demande directe"}</small>
                                    <span className="slot-row"><em>{texteCreneau(d.creneau)}</em><em>{STATUTS[d.statut]}</em></span>
                                </span>
                                <Icone nom="chevron" />
                            </Link>
                        ))}
                        {suggestions && !estJeune && suggestions.map((j) => (
                            <Link key={j.id} to={`/jeunes/${j.id}`} className="helper-card helper-card-rich">
                                <Avatar personne={j} />
                                <span>
                                    <strong>{j.prenom}</strong>
                                    <small>{texteDistance(j.distance)} · {(j.services || []).map(nomService).join(" & ")}</small>
                                    <span className="slot-row">{(j.disponibilites || []).slice(0, 2).map((c) => <em key={c.id}>{texteCreneau(c)}</em>)}</span>
                                </span>
                                <Icone nom="chevron" />
                            </Link>
                        ))}
                    </div>
                    <Astuce>Le pourboire est libre, jamais obligatoire, <br />et se donne directement entre vous.</Astuce>
                </div>
            </div>
            <Navigation />
        </div>
    );
};

export default Accueil;
