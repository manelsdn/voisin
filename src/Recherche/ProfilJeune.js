import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { useSession } from "../composants/Session";
import { Avatar, Ecran, LienBouton } from "../composants/Mise";
import { Icone } from "../composants/Icones";
import { avisDuJeune, basculerFavori, likesDuJeune, lireUtilisateur, mesDemandes, mesFavoris, pointDeRecherche } from "../services/api";
import { distanceKm } from "../services/geo";
import { creneauxActifs, nomService, texteCreneau, texteDistance } from "../services/constantes";

const age = (date) => date ? Math.floor((Date.now() - new Date(date)) / 31557600000) : null;

const ProfilJeune = () => {
    const { id } = useParams();
    const { search } = useLocation();
    const { utilisateur } = useSession();
    const [jeune, setJeune] = useState(undefined);
    const [distance, setDistance] = useState(null);
    const [avis, setAvis] = useState([]);
    const [favoris, setFavoris] = useState([]);
    const [likes, setLikes] = useState(0);
    const [lien, setLien] = useState(false);
    const moi = id === utilisateur.id;

    useEffect(() => {
        const charger = async () => {
            const j = await lireUtilisateur(id);
            setJeune(j && j.role === "JEUNE" ? j : null);
            if (j) setDistance(distanceKm((await pointDeRecherche(utilisateur)).position, j));
            if (j && j.role === "JEUNE") {
                setAvis(await avisDuJeune(id).catch(() => []));
                setLikes((await likesDuJeune(id)).length);
            }
            setFavoris(await mesFavoris(utilisateur).catch(() => []));
            const demandes = await mesDemandes(utilisateur).catch(() => []);
            setLien(demandes.some((d) => d.jeuneId === id && d.statut === "ACCEPTEE"));
        };
        charger();
    }, [id, utilisateur]);

    if (jeune === undefined) return <Ecran retour><p className="soft">Chargement…</p></Ecran>;
    if (jeune === null) return <Ecran retour titre="Profil introuvable"><div className="notice">Ce profil n'existe pas ou n'est plus en ligne.</div></Ecran>;
    const a = age(jeune.dateNaissance);

    const creneaux = creneauxActifs(jeune.disponibilites).map(texteCreneau);
    const favori = favoris.includes(jeune.id);
    const moyenne = avis.length ? avis.reduce((t, x) => t + x.note, 0) / avis.length : 0;
    const basculer = async () => {
        setFavoris(await basculerFavori(utilisateur, jeune.id));
        setLikes((await likesDuJeune(jeune.id)).length);
    };

    return (
        <Ecran retour surtitre={moi ? "APERÇU DE MON ANNONCE" : undefined}>
            <div className={jeune.photoProfil ? "profile-portrait" : "profile-portrait initiale"}><Avatar personne={jeune} classe="" /></div>
            <div className="profile-name">
                <h1>{jeune.prenom}{a ? `, ${a} ans` : ""}</h1>
                {!moi && <p className="soft"><Icone nom="pin" /> À {texteDistance(distance)} · {jeune.ville}</p>}
                {avis.length > 0 && <p className="etoiles-resume"><span className="etoiles" aria-hidden="true">{"★".repeat(Math.round(moyenne))}{"☆".repeat(5 - Math.round(moyenne))}</span> {moyenne.toFixed(1).replace(".", ",")} / 5 · {avis.length} avis</p>}
                {!moi && utilisateur.role !== "JEUNE" && <button type="button" className={favori ? "post-act liked" : "post-act"} aria-pressed={favori} onClick={basculer}><Icone nom="heart" />{favori ? "Vous aimez" : "J'aime"}</button>}
                {likes > 0 && <p className="likes-resume"><Icone nom="heart" />{likes} voisin{likes > 1 ? "s aiment" : " aime"} {moi ? "votre annonce" : "son annonce"}</p>}
            </div>
            {!moi && (
                <div className={lien && jeune.telephone ? "numero numero-visible" : "numero"}>
                    <Icone nom="phone" />
                    {lien && jeune.telephone
                        ? <span><small>Son numéro</small><a href={`tel:${jeune.telephone.replace(/\s/g, "")}`}>{jeune.telephone}</a></span>
                        : <span><small>Son numéro</small><strong>Masqué</strong><em>Il s'affiche pendant un service accepté par {jeune.prenom}.</em></span>}
                </div>
            )}
            {jeune.description && <p>{jeune.description}</p>}
            <div className="detail-box">
                <span className="mini-eyebrow">JE PEUX VOUS AIDER POUR</span>
                <p>{(jeune.services || []).map(nomService).join(" · ")}</p>
                <div className="text-row"><span><Icone nom="clock" /> Ses disponibilités</span><strong>{creneaux.join(" · ")}</strong></div>
                <p><small>{jeune.prenom} propose ces créneaux ; vous choisissez celui qui vous convient.</small></p>
            </div>
            {avis.length > 0 && (
                <section className="detail-box avis" aria-label="Avis">
                    <span className="mini-eyebrow">AVIS APRÈS UN SERVICE</span>
                    {avis.map((a) => (
                        <div className="avis-ligne" key={a.id}>
                            <span className="etoiles" aria-label={`${a.note} sur 5`}>{"★".repeat(a.note)}{"☆".repeat(5 - a.note)}</span>
                            {a.commentaire && <p>{a.commentaire}</p>}
                            <small>{a.auteurPrenom}{a.service ? ` · ${nomService(a.service)}` : ""}</small>
                        </div>
                    ))}
                </section>
            )}
            <div className="stack-actions actions-flottantes">
                {moi ? <LienBouton to="/annonce" fleche>Modifier mon annonce</LienBouton> : utilisateur.role !== "JEUNE" && <LienBouton to={`/jeunes/${jeune.id}/demande${search}`} fleche>Envoyer une demande</LienBouton>}
                {!moi && <Link className="secondary" to={`/messages/${jeune.id}`}>Échanger avec {jeune.prenom}</Link>}
            </div>
        </Ecran>
    );
};

export default ProfilJeune;
