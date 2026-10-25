import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useSession } from "../composants/Session";
import { Avatar, Ecran, LienBouton } from "../composants/Mise";
import { Icone } from "../composants/Icones";
import { deconnecter, listerProches, lireUtilisateur, mesFavoris } from "../services/api";
import { ROLES } from "../services/constantes";

const Profil = () => {
    const { utilisateur } = useSession();
    const [proche, setProche] = useState(null);
    const [favoris, setFavoris] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        if (utilisateur.role === "ACCOMPAGNANT") listerProches(utilisateur.id).then((l) => setProche(l[0] || null));
        if (utilisateur.role !== "JEUNE") mesFavoris(utilisateur).then((ids) => Promise.all(ids.map(lireUtilisateur))).then((l) => setFavoris(l.filter(Boolean))).catch(() => setFavoris([]));
    }, [utilisateur]);

    const sortir = async () => {
        await deconnecter();
        navigate("/bienvenue", { replace: true });
    };

    return (
        <Ecran titre={<>Votre place <br />dans le quartier.</>} surtitre="MON PROFIL">
            <div className={utilisateur.photoProfil ? "profile-portrait" : "profile-portrait initiale"}><Avatar personne={utilisateur} classe="" /></div>
            <div className="profile-name">
                <h2>{utilisateur.prenom} {utilisateur.nom}</h2>
                <p className="soft">{ROLES[utilisateur.role]}</p>
            </div>
            <div className="text-row"><span><Icone nom="pin" /> Mon quartier</span><Link className="link-button" to={utilisateur.role === "ACCOMPAGNANT" ? "/proche" : "/modifier-profil"}>{utilisateur.ville}</Link></div>
            <div className="text-row"><span>E-mail</span><span>{utilisateur.email}</span></div>
            <div className="text-row"><span><Icone nom="phone" /> Mon numéro</span><span>{utilisateur.telephone}</span></div>
            <div className="text-row"><span>Adresse</span><span>{utilisateur.adresse}, {utilisateur.codePostal} {utilisateur.ville}</span></div>
            {utilisateur.role === "ACCOMPAGNANT" && <div className="text-row"><span><Icone nom="users" /> Mon proche</span><Link className="link-button" to="/proche">{proche ? proche.prenom : "Ajouter"}</Link></div>}
            {utilisateur.role !== "JEUNE" && (
                <section className="favoris" aria-label="Mes favoris">
                    <span className="mini-eyebrow">MES FAVORIS</span>
                    {favoris.length === 0 && <p className="soft"><small>Touchez le cœur sur le fil ou sur un profil pour retrouver un jeune ici.</small></p>}
                    {favoris.map((j) => (
                        <Link key={j.id} to={`/jeunes/${j.id}`} className="helper-card">
                            <Avatar personne={j} />
                            <span><strong>{j.prenom}</strong><small>{j.ville}</small></span>
                            <Icone nom="chevron" />
                        </Link>
                    ))}
                </section>
            )}
            <div className="stack-actions">
                <LienBouton to="/modifier-profil" secondaire>Modifier mes informations</LienBouton>
                {utilisateur.role === "JEUNE" && (
                    <>
                        <LienBouton to="/annonce" secondaire>Modifier mon annonce</LienBouton>
                        {utilisateur.annoncePubliee && <LienBouton to={`/jeunes/${utilisateur.id}`} secondaire>Voir mon annonce</LienBouton>}
                    </>
                )}
                <Link className="link-button" to="/charte">La charte d'entraide</Link>
                <button className="secondary" type="button" onClick={sortir}>Se déconnecter</button>
            </div>
        </Ecran>
    );
};

export default Profil;
