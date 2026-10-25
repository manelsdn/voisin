import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useSession } from "../composants/Session";
import { Astuce, Avatar, Ecran, LienBouton } from "../composants/Mise";
import { Icone } from "../composants/Icones";
import { lireUtilisateur, pointDeRecherche } from "../services/api";
import { distanceKm } from "../services/geo";
import { nomService, texteCreneau, texteDistance } from "../services/constantes";

const age = (date) => date ? Math.floor((Date.now() - new Date(date)) / 31557600000) : null;

const ProfilJeune = () => {
    const { id } = useParams();
    const { utilisateur } = useSession();
    const [jeune, setJeune] = useState(undefined);
    const [distance, setDistance] = useState(null);
    const moi = id === utilisateur.id;

    useEffect(() => {
        const charger = async () => {
            const j = await lireUtilisateur(id);
            setJeune(j && j.role === "JEUNE" ? j : null);
            if (j) setDistance(distanceKm((await pointDeRecherche(utilisateur)).position, j));
        };
        charger();
    }, [id, utilisateur]);

    if (jeune === undefined) return <Ecran retour><p className="soft">Chargement…</p></Ecran>;
    if (jeune === null) return <Ecran retour titre="Profil introuvable"><div className="notice">Ce profil n'existe pas ou n'est plus en ligne.</div></Ecran>;
    const a = age(jeune.dateNaissance);

    const creneaux = (jeune.disponibilites || []).map(texteCreneau);

    return (
        <Ecran retour surtitre={moi ? "APERÇU DE MON ANNONCE" : "UN JEUNE DU QUARTIER"}>
            <div className={jeune.photoProfil ? "profile-portrait" : "profile-portrait initiale"}><Avatar personne={jeune} classe="" /></div>
            <div className="profile-name">
                <h2>{jeune.prenom}{a ? `, ${a} ans` : ""}</h2>
                {!moi && <p className="soft"><Icone nom="pin" /> À {texteDistance(distance)} · {jeune.ville}</p>}
            </div>
            {jeune.description && <p>{jeune.description}</p>}
            <div className="detail-box">
                <span className="mini-eyebrow">JE PEUX VOUS AIDER POUR</span>
                <p>{(jeune.services || []).map(nomService).join(" · ")}</p>
                <div className="text-row"><span><Icone nom="clock" /> Ses disponibilités</span><strong>{creneaux.join(" · ")}</strong></div>
                <p><small>{jeune.prenom} propose ces créneaux ; vous choisissez celui qui vous convient.</small></p>
            </div>
            <Astuce>Pourboire libre et directement entre vous. Le numéro s'affiche une fois la demande acceptée.</Astuce>
            <div className="stack-actions">
                {moi ? <LienBouton to="/annonce" fleche>Modifier mon annonce</LienBouton> : utilisateur.role !== "JEUNE" && <LienBouton to={`/jeunes/${jeune.id}/demande`} fleche>Envoyer une demande</LienBouton>}
                {!moi && <Link className="secondary" to={`/messages/${jeune.id}`}>Échanger avec {jeune.prenom}</Link>}
            </div>
        </Ecran>
    );
};

export default ProfilJeune;
