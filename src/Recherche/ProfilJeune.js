import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useSession } from "../composants/Session";
import { Astuce, Avatar, Ecran, LienBouton } from "../composants/Mise";
import { Icone } from "../composants/Icones";
import { avisDuJeune, basculerFavori, lireUtilisateur, mesFavoris, pointDeRecherche } from "../services/api";
import { distanceKm } from "../services/geo";
import { nomService, texteCreneau, texteDistance } from "../services/constantes";

const age = (date) => date ? Math.floor((Date.now() - new Date(date)) / 31557600000) : null;

const ProfilJeune = () => {
    const { id } = useParams();
    const { utilisateur } = useSession();
    const [jeune, setJeune] = useState(undefined);
    const [distance, setDistance] = useState(null);
    const [avis, setAvis] = useState([]);
    const [favoris, setFavoris] = useState([]);
    const moi = id === utilisateur.id;

    useEffect(() => {
        const charger = async () => {
            const j = await lireUtilisateur(id);
            setJeune(j && j.role === "JEUNE" ? j : null);
            if (j) setDistance(distanceKm((await pointDeRecherche(utilisateur)).position, j));
            if (j && j.role === "JEUNE") setAvis(await avisDuJeune(id).catch(() => []));
            setFavoris(await mesFavoris(utilisateur).catch(() => []));
        };
        charger();
    }, [id, utilisateur]);

    if (jeune === undefined) return <Ecran retour><p className="soft">Chargement…</p></Ecran>;
    if (jeune === null) return <Ecran retour titre="Profil introuvable"><div className="notice">Ce profil n'existe pas ou n'est plus en ligne.</div></Ecran>;
    const a = age(jeune.dateNaissance);

    const creneaux = (jeune.disponibilites || []).map(texteCreneau);
    const favori = favoris.includes(jeune.id);
    const moyenne = avis.length ? avis.reduce((t, x) => t + x.note, 0) / avis.length : 0;
    const basculer = async () => setFavoris(await basculerFavori(utilisateur, jeune.id));

    return (
        <Ecran retour surtitre={moi ? "APERÇU DE MON ANNONCE" : "UN JEUNE DU QUARTIER"}>
            <div className={jeune.photoProfil ? "profile-portrait" : "profile-portrait initiale"}><Avatar personne={jeune} classe="" /></div>
            <div className="profile-name">
                <h2>{jeune.prenom}{a ? `, ${a} ans` : ""}</h2>
                {!moi && <p className="soft"><Icone nom="pin" /> À {texteDistance(distance)} · {jeune.ville}</p>}
                {avis.length > 0 && <p className="etoiles-resume"><span className="etoiles" aria-hidden="true">{"★".repeat(Math.round(moyenne))}{"☆".repeat(5 - Math.round(moyenne))}</span> {moyenne.toFixed(1).replace(".", ",")} / 5 · {avis.length} avis</p>}
                {!moi && utilisateur.role !== "JEUNE" && <button type="button" className={favori ? "post-act liked" : "post-act"} aria-pressed={favori} onClick={basculer}><Icone nom="heart" />{favori ? "Dans mes favoris" : "Ajouter aux favoris"}</button>}
            </div>
            {jeune.description && <p>{jeune.description}</p>}
            <div className="detail-box">
                <span className="mini-eyebrow">JE PEUX VOUS AIDER POUR</span>
                <p>{(jeune.services || []).map(nomService).join(" · ")}</p>
                <div className="text-row"><span><Icone nom="clock" /> Ses disponibilités</span><strong>{creneaux.join(" · ")}</strong></div>
                <p><small>{jeune.prenom} propose ces créneaux ; vous choisissez celui qui vous convient.</small></p>
            </div>
            {avis.length > 0 && (
                <section className="detail-box avis" aria-label="Avis">
                    <span className="mini-eyebrow">CE QU'EN DISENT LES VOISINS</span>
                    {avis.map((a) => (
                        <div className="avis-ligne" key={a.id}>
                            <span className="etoiles" aria-label={`${a.note} sur 5`}>{"★".repeat(a.note)}{"☆".repeat(5 - a.note)}</span>
                            {a.commentaire && <p>{a.commentaire}</p>}
                            <small>{a.auteurPrenom} · {nomService(a.service)}</small>
                        </div>
                    ))}
                </section>
            )}
            <Astuce>Pourboire libre et directement entre vous. Le numéro s'affiche une fois la demande acceptée.</Astuce>
            <div className="stack-actions actions-flottantes">
                {moi ? <LienBouton to="/annonce" fleche>Modifier mon annonce</LienBouton> : utilisateur.role !== "JEUNE" && <LienBouton to={`/jeunes/${jeune.id}/demande`} fleche>Envoyer une demande</LienBouton>}
                {!moi && <Link className="secondary" to={`/messages/${jeune.id}`}>Échanger avec {jeune.prenom}</Link>}
            </div>
        </Ecran>
    );
};

export default ProfilJeune;
