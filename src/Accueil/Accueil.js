import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSession } from "../composants/Session";
import { Astuce, Avatar, Navigation } from "../composants/Mise";
import { Icone } from "../composants/Icones";
import { besoinsProches, mesBesoins, mesConversations, mesDemandes, pointDeRecherche, propositionsDuBesoin } from "../services/api";
import { texteDate } from "../services/geo";
import { ROLES, STATUTS, imageService, nomService, texteCreneau, texteDistance } from "../services/constantes";

const majuscule = (t) => (t ? t.charAt(0).toUpperCase() + t.slice(1) : "");

const aujourdhui = () => new Date().toISOString().slice(0, 10);

const Tuile = ({ to, nombre, libelle, icone, alerte }) => (
    <Link className={`tuile${alerte && nombre > 0 ? " tuile-alerte" : ""}`} to={to}>
        <span className="tuile-icone"><Icone nom={icone} /></span>
        <b>{nombre === null ? "–" : nombre}</b>
        <span>{libelle}</span>
    </Link>
);

const Accueil = () => {
    const { utilisateur } = useSession();
    const estJeune = utilisateur.role === "JEUNE";
    const [proche, setProche] = useState(null);
    const [demandes, setDemandes] = useState(null);
    const [conversations, setConversations] = useState(null);
    const [extra, setExtra] = useState(null);
    const ville = (proche && proche.ville) || utilisateur.ville;

    useEffect(() => {
        let actif = true;
        const charger = async () => {
            const { personne, position } = await pointDeRecherche(utilisateur);
            const [liste, convs] = await Promise.all([mesDemandes(utilisateur), mesConversations(utilisateur).catch(() => [])]);
            let complement = 0;
            if (estJeune) {
                complement = (await besoinsProches(position, { rayon: 5 }).catch(() => [])).length;
            } else {
                const ouverts = (await mesBesoins(utilisateur).catch(() => [])).filter((b) => b.statut === "OUVERTE");
                const nombres = await Promise.all(ouverts.map((b) => propositionsDuBesoin(b.id).then((p) => p.length).catch(() => 0)));
                complement = nombres.reduce((a, b) => a + b, 0);
            }
            if (!actif) return;
            if (personne.id !== utilisateur.id) setProche(personne);
            setDemandes(liste);
            setConversations(convs);
            setExtra(complement);
        };
        charger();
        return () => { actif = false; };
    }, [utilisateur, estJeune]);

    const enAttente = demandes ? demandes.filter((d) => d.statut === "ENVOYEE") : [];
    const acceptees = demandes ? demandes.filter((d) => d.statut === "ACCEPTEE").sort((a, b) => (a.dateSouhaitee || "").localeCompare(b.dateSouhaitee || "")) : [];
    const aVenir = acceptees.filter((d) => (d.dateSouhaitee || "") >= aujourdhui());
    const prochain = aVenir[0] || acceptees[acceptees.length - 1] || null;
    const avec = prochain ? (estJeune ? prochain.beneficiairePrenom : prochain.jeunePrenom) : "";
    const pourQui = proche ? proche.prenom : null;

    return (
        <div className="ecran vdo accueil-simple" id="vdo">
            <div className="corps">
                <div className="home-top">
                    <Link className="location-button" to={utilisateur.role === "ACCOMPAGNANT" ? "/proche" : "/modifier-profil"} aria-label={`Mon quartier : ${ville}`}><Icone nom="pin" />{ville}<Icone nom="down" /></Link>
                    <Link className="avatar" to="/profil" aria-label="Mon profil"><Avatar personne={utilisateur} classe="mini-persona-photo" /></Link>
                </div>
                <div className="home-content">
                    <div className="bonjour-ligne"><h1 className="greeting">Bonjour {utilisateur.prenom}</h1><span className="role-badge">{ROLES[utilisateur.role]}</span></div>
                    {utilisateur.role === "ACCOMPAGNANT" && (
                        <Link className="beneficiary" to="/proche">
                            <Icone nom="users" />
                            {proche && proche.photoProfil && <img className="badge-persona-photo" src={proche.photoProfil} alt="" />}
                            <span>{proche ? <>Pour <strong>{proche.prenom}</strong>, votre proche</> : "Ajouter la personne que vous accompagnez"}</span>
                            <span className="chevron"><Icone nom="down" /></span>
                        </Link>
                    )}

                    {estJeune ? (
                        utilisateur.annoncePubliee ? (
                            <Link className="action-principale action-calme" to="/annonce">
                                <span className="action-icone"><Icone nom="check" /></span>
                                <span><strong>Votre annonce est en ligne</strong><small>Les voisins voient vos services et vos créneaux.</small></span>
                                <Icone nom="chevron" />
                            </Link>
                        ) : (
                            <Link className="action-principale" to="/annonce">
                                <span className="action-icone"><Icone nom="sparkles" /></span>
                                <span><strong>Publier mon annonce</strong><small>Dites ce que vous savez faire et quand vous êtes libre.</small></span>
                                <Icone nom="arrow" />
                            </Link>
                        )
                    ) : (
                        <Link className="action-principale" to="/besoins/nouveau">
                            <span className="action-icone"><Icone nom="mic" /></span>
                            <span><strong>{pourQui ? `De quoi ${pourQui} a besoin\u00a0?` : "De quoi avez-vous besoin\u00a0?"}</strong><small>Écrivez-le ou dites-le au micro. Les jeunes du quartier vous répondent.</small></span>
                            <Icone nom="arrow" />
                        </Link>
                    )}

                    {prochain && (
                        <>
                            <h3 className="section-h">{aVenir.length ? "Prochain rendez-vous" : "Rendez-vous confirmé"}</h3>
                            <Link className="rdv-carte" to={`/demandes/${prochain.id}`}>
                                <img src={imageService(prochain.service)} alt="" />
                                <span>
                                    <strong>{nomService(prochain.service)} avec {avec}</strong>
                                    <small>{majuscule(texteDate(prochain.dateSouhaitee))} · {prochain.creneau && `${prochain.creneau.heureDebut}-${prochain.creneau.heureFin}`}</small>
                                </span>
                                <Icone nom="chevron" />
                            </Link>
                        </>
                    )}

                    <h3 className="section-h">En ce moment</h3>
                    <div className="tuiles">
                        {estJeune ? (
                            <>
                                <Tuile to="/services" nombre={demandes && enAttente.length} libelle="à répondre" icone="calendar" alerte />
                                <Tuile to="/recherche" nombre={extra} libelle="besoins près de vous" icone="heart" />
                                <Tuile to="/messages" nombre={conversations && conversations.length} libelle="conversations" icone="message" />
                            </>
                        ) : (
                            <>
                                <Tuile to="/services" nombre={demandes && enAttente.length} libelle="en attente de réponse" icone="clock" />
                                <Tuile to="/besoins" nombre={extra} libelle="propositions d'aide" icone="heart" alerte />
                                <Tuile to="/messages" nombre={conversations && conversations.length} libelle="conversations" icone="message" />
                            </>
                        )}
                    </div>

                    {estJeune && (
                        <>
                            <h3 className="section-h">Demandes reçues</h3>
                            {demandes === null && <div className="squelettes">{[0, 1].map((i) => <span key={i} className="squelette" />)}</div>}
                            {demandes && enAttente.length === 0 && <p className="soft">Aucune demande en attente. Touchez « Aider » pour voir les besoins du quartier.</p>}
                            <div className="liste-cartes">
                                {enAttente.map((d) => (
                                    <Link key={d.id} to={`/demandes/${d.id}`} className="carte-profil">
                                        <span className="carte-photo carte-service"><img src={imageService(d.service)} alt="" /></span>
                                        <span className="carte-corps">
                                            <span className="carte-ligne"><strong>{d.beneficiairePrenom} · {nomService(d.service)}</strong></span>
                                            <small>{texteDistance(d.distanceKm)} · {texteCreneau(d.creneau)}</small>
                                            <span className="carte-bas"><em className="statut ENVOYEE">{STATUTS[d.statut]}</em></span>
                                        </span>
                                        <Icone nom="chevron" />
                                    </Link>
                                ))}
                            </div>
                        </>
                    )}

                    {!estJeune && (
                        <Link className="lien-fil" to="/fil">
                            <span className="lien-fil-photos" aria-hidden="true"><img src="/assets/avatars/anais.jpg" alt="" /><img src="/assets/avatars/lucas.jpg" alt="" /><img src="/assets/avatars/chloe.jpg" alt="" /></span>
                            <span><strong>Le fil du quartier</strong><small>Les jeunes près de chez vous et ce qu'ils aiment faire.</small></span>
                            <Icone nom="chevron" />
                        </Link>
                    )}
                    <Astuce>Pourboire libre, directement entre vous.</Astuce>
                </div>
            </div>
            <Navigation />
        </div>
    );
};

export default Accueil;
