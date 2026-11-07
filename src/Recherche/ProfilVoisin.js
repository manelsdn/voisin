import { useEffect, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { useSession } from "../composants/Session";
import { Avatar, Ecran, LienBouton } from "../composants/Mise";
import { Icone } from "../composants/Icones";
import { lireUtilisateur, listerProches, mesDemandes } from "../services/api";
import { ROLES } from "../services/constantes";

const ProfilVoisin = () => {
    const { id } = useParams();
    const { utilisateur } = useSession();
    const [voisin, setVoisin] = useState(undefined);
    const [proche, setProche] = useState(null);
    const [lien, setLien] = useState(false);

    useEffect(() => {
        const charger = async () => {
            const v = await lireUtilisateur(id).catch(() => null);
            setVoisin(v);
            if (!v) return;
            if (v.role === "ACCOMPAGNANT") setProche((await listerProches(v.id).catch(() => []))[0] || null);
            const demandes = await mesDemandes(utilisateur).catch(() => []);
            setLien(demandes.some((d) => d.statut === "ACCEPTEE" && (d.demandeurId === id || d.beneficiaireId === id)));
        };
        charger();
    }, [id, utilisateur]);

    if (voisin === undefined) return <Ecran retour><p className="soft">Chargement…</p></Ecran>;
    if (voisin === null) return <Ecran retour titre="Profil introuvable"><div className="notice">Ce profil n'existe pas.</div></Ecran>;
    if (voisin.role === "JEUNE") return <Navigate to={`/jeunes/${id}`} replace />;

    return (
        <Ecran retour>
            <div className={voisin.photoProfil ? "profile-portrait" : "profile-portrait initiale"}><Avatar personne={voisin} classe="" /></div>
            <div className="profile-name">
                <h1>{voisin.prenom}</h1>
                <p className="soft">{ROLES[voisin.role]}{voisin.ville ? ` · ${voisin.ville}` : ""}</p>
            </div>
            {proche && <p className="hint"><Icone nom="users" /><span>Accompagne {proche.prenom} pour ses demandes d'aide.</span></p>}
            <div className="detail-box">
                <div className="text-row numero">
                    <span><Icone nom="phone" /> Numéro</span>
                    {lien && voisin.telephone ? <strong className="numero-visible"><a href={`tel:${voisin.telephone.replace(/\s/g, "")}`}>{voisin.telephone}</a></strong> : <strong>Masqué</strong>}
                </div>
                {!lien && <p className="soft"><small>Il s'affiche pendant un service accepté avec {voisin.prenom}.</small></p>}
            </div>
            <div className="stack-actions">
                <LienBouton to={`/messages/${voisin.id}`} fleche>Écrire à {voisin.prenom}</LienBouton>
            </div>
        </Ecran>
    );
};

export default ProfilVoisin;
