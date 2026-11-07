import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSession } from "../composants/Session";
import { Avatar, IconesServices, Navigation } from "../composants/Mise";
import { Icone } from "../composants/Icones";
import { avisEnAttente, besoinsProches, likesDuJeune, mesDemandes, pointDeRecherche, rechercherJeunes } from "../services/api";
import { ROLES, SERVICES, iconeService, imageService, nomService, texteCreneau, texteDistance } from "../services/constantes";

const Accueil = () => {
    const { utilisateur } = useSession();
    const estJeune = utilisateur.role === "JEUNE";
    const [proche, setProche] = useState(null);
    const [une, setUne] = useState(null);
    const [attente, setAttente] = useState([]);
    const [aNoter, setANoter] = useState([]);
    const [fans, setFans] = useState([]);
    const cleFans = `vdo-fans-vus-${utilisateur.id}`;
    const [fansVus, setFansVus] = useState(() => {
        try {
            return Number(localStorage.getItem(cleFans)) || 0;
        } catch (e) {
            return 0;
        }
    });
    const masquerFans = () => {
        setFansVus(fans.length);
        try {
            localStorage.setItem(cleFans, String(fans.length));
        } catch (e) {
            return;
        }
    };
    const ville = (proche && proche.ville) || utilisateur.ville;

    useEffect(() => {
        let actif = true;
        const charger = async () => {
            const { personne, position } = await pointDeRecherche(utilisateur);
            const [liste, demandes] = await Promise.all([
                estJeune ? besoinsProches(position, { rayon: 2 }).catch(() => []) : rechercherJeunes(position, { rayon: 2 }).catch(() => []),
                mesDemandes(utilisateur).catch(() => [])
            ]);
            if (!actif) return;
            if (personne.id !== utilisateur.id) setProche(personne);
            setUne(estJeune ? liste.slice(0, 6) : liste.filter((j) => j.photoProfil).slice(0, 6));
            setAttente(demandes.filter((d) => d.statut === "ENVOYEE"));
            if (!estJeune) setANoter(await avisEnAttente(utilisateur).catch(() => []));
            if (estJeune) setFans((await likesDuJeune(utilisateur.id)).sort((x, y) => (y.creeAt || "").localeCompare(x.creeAt || "")));
        };
        charger();
        return () => { actif = false; };
    }, [utilisateur, estJeune]);

    const pour = proche ? proche.prenom : null;
    const lienService = (code) => `/recherche?service=${code}`;

    return (
        <div className="ecran vdo accueil-vitrine" id="vdo">
            <main className="corps">
                <div className="home-top">
                    <Link className="location-button" to={utilisateur.role === "ACCOMPAGNANT" ? "/proche" : "/modifier-profil"} aria-label={`Mon quartier : ${ville}`}><Icone nom="pin" />{ville}<Icone nom="down" /></Link>
                    <Link className="avatar" to="/profil" aria-label="Mon profil"><Avatar personne={utilisateur} classe="mini-persona-photo" /></Link>
                </div>
                <div className="home-content">
                    <section className="vitrine-hero hero-fond">
                        <img src="/assets/presentation/fond-lyon.jpg" alt="" />
                        <div className="vitrine-voile">
                            <span className="role-badge">{ROLES[utilisateur.role]}</span>
                            <p className="greeting">Bonjour {utilisateur.prenom} !</p>
                            <h1>{estJeune ? <>Un coup de main, un sourire en retour.</> : <>Petits services, grands liens.</>}</h1>
                            <Link className="vitrine-recherche" to={estJeune ? "/annonce" : "/besoins/nouveau"}>
                                <Icone nom={estJeune ? "sparkles" : "mic"} />
                                <span>{estJeune ? (utilisateur.annoncePubliee ? "Modifier mon annonce" : "Publier mon annonce") : pour ? `De quoi ${pour} a besoin ?` : "De quoi avez-vous besoin ?"}</span>
                            </Link>
                        </div>
                    </section>

                    {utilisateur.role === "ACCOMPAGNANT" && (
                        <Link className="beneficiary" to="/proche">
                            <Icone nom="users" />
                            {proche && proche.photoProfil && <img className="badge-persona-photo" src={proche.photoProfil} alt="" />}
                            <span>{proche ? <>Pour <strong>{proche.prenom}</strong>, votre proche</> : "Ajouter la personne que vous accompagnez"}</span>
                            <span className="chevron"><Icone nom="down" /></span>
                        </Link>
                    )}

                    {!estJeune && aNoter.map((d) => (
                        <Link key={d.id} className="bandeau-attente bandeau-avis" to={`/demandes/${d.id}`}>
                            <span className="bandeau-etoile" aria-hidden="true">★</span>
                            <span><strong>Service terminé avec {d.jeunePrenom}</strong>Laissez-lui un avis.</span>
                            <Icone nom="chevron" />
                        </Link>
                    ))}

                    {!estJeune && attente.length > 0 && (
                        <Link className="bandeau-attente" to="/services">
                            <span className="bandeau-point" aria-hidden="true" />
                            <span><strong>{attente.length > 1 ? `${attente.length} demandes en attente` : "Demande en attente"}</strong>Le jeune va vous répondre.</span>
                            <Icone nom="chevron" />
                        </Link>
                    )}

                    {estJeune && fans.length > fansVus && (
                        <div className="bandeau-likes-boite">
                            <Link className="bandeau-likes" to={`/jeunes/${utilisateur.id}`}>
                                <span className="bandeau-coeur"><Icone nom="heart" /></span>
                                <span><strong>{fans.length} voisin{fans.length > 1 ? "s aiment" : " aime"} votre annonce</strong>{fans.slice(0, 3).map((f) => f.prenom).join(", ")}{fans.length > 3 ? "…" : ""}</span>
                            </Link>
                            <button type="button" className="bandeau-fermer" aria-label="Masquer ce message" onClick={masquerFans}>×</button>
                        </div>
                    )}

                    <h2 className="vitrine-titre">{estJeune ? "Ce que vous pouvez proposer" : "Un coup de main pour…"}</h2>
                    <div className="categories" role="list" aria-label="Services">
                        {SERVICES.map((s) => (
                            <div key={s.code} role="listitem">
                                <Link className="categorie" to={estJeune ? "/annonce" : lienService(s.code)}>
                                    <span className="categorie-image"><img src={s.image} alt="" /><i><Icone nom={iconeService(s.code)} /></i></span>
                                    <span>{s.nom}</span>
                                </Link>
                            </div>
                        ))}
                    </div>

                    <div className="vitrine-entete">
                        <h2 className="vitrine-titre">{estJeune ? "Ils ont besoin d'un coup de main" : "Vos voisins volontaires"}</h2>
                        <Link className="see-all" to="/recherche">Tout voir<Icone nom="chevron" /></Link>
                    </div>
                    {une === null && <div className="carrousel">{[0, 1, 2].map((i) => <span key={i} className="squelette squelette-carte" />)}</div>}
                    {une && une.length === 0 && <p className="soft">{estJeune ? "Pas encore de besoin publié près de chez vous." : "Pas encore de jeune à moins de 2 km."}</p>}
                    {une && une.length > 0 && (
                        <div className="carrousel" role="list" aria-label={estJeune ? "Besoins à la une" : "Jeunes à la une"}>
                            {estJeune
                                ? une.map((b) => (
                                    <div key={b.id} role="listitem"><Link className="carte-une" to={`/besoins/${b.id}`}>
                                        <span className="carte-une-image"><img src={`/assets/services/plein/${b.service.toLowerCase()}.jpg`} alt="" /><em>{texteDistance(b.distance)}</em></span>
                                        <strong>{b.beneficiairePrenom}</strong>
                                        <small>{nomService(b.service)} · {b.creneau ? texteCreneau(b.creneau) : "quand vous voulez"}</small>
                                    </Link></div>
                                ))
                                : une.map((j) => (
                                    <div key={j.id} role="listitem"><Link className="carte-une" to={`/jeunes/${j.id}`}>
                                        <span className="carte-une-image"><Avatar personne={j} classe="carte-une-photo" /><em>{texteDistance(j.distance)}</em></span>
                                        <strong>{j.prenom}</strong>
                                        <IconesServices services={j.services} max={3} />
                                    </Link></div>
                                ))}
                        </div>
                    )}

                    {estJeune && attente.length > 0 && (
                        <>
                            <h2 className="vitrine-titre">Demandes reçues</h2>
                            <div className="liste-cartes">
                                {attente.map((d) => (
                                    <Link key={d.id} to={`/demandes/${d.id}`} className="carte-profil">
                                        <span className="carte-photo carte-service"><img src={imageService(d.service)} alt="" /></span>
                                        <span className="carte-corps">
                                            <span className="carte-ligne"><strong>{d.beneficiairePrenom} · {nomService(d.service)}</strong></span>
                                            <small>{texteDistance(d.distanceKm)} · {texteCreneau(d.creneau)}</small>
                                        </span>
                                        <Icone nom="chevron" />
                                    </Link>
                                ))}
                            </div>
                        </>
                    )}

                </div>
            </main>
            <Navigation />
        </div>
    );
};

export default Accueil;
