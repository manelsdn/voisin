import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useSession } from "../composants/Session";
import { Avatar, Ecran, LienBouton, Message } from "../composants/Mise";
import { Icone } from "../composants/Icones";
import { deconnecter, listerProches, lireUtilisateur, mesFavoris, retirerAnnonce, supprimerCompte } from "../services/api";
import { ROLES } from "../services/constantes";

const Profil = () => {
    const { utilisateur, recharger } = useSession();
    const [proche, setProche] = useState(null);
    const [favoris, setFavoris] = useState([]);
    const navigate = useNavigate();
    const [confirmer, setConfirmer] = useState(false);
    const [erreur, setErreur] = useState("");
    const [enCours, setEnCours] = useState(false);

    useEffect(() => {
        if (utilisateur.role === "ACCOMPAGNANT") listerProches(utilisateur.id).then((l) => setProche(l[0] || null));
        if (utilisateur.role !== "JEUNE") mesFavoris(utilisateur).then((ids) => Promise.all(ids.map(lireUtilisateur))).then((l) => setFavoris(l.filter(Boolean))).catch(() => setFavoris([]));
    }, [utilisateur]);

    const retirer = async () => {
        await retirerAnnonce(utilisateur);
        await recharger();
    };

    const supprimer = async () => {
        setEnCours(true);
        try {
            await supprimerCompte(utilisateur);
            navigate("/bienvenue", { replace: true });
        } catch (e) {
            setErreur("La suppression n'a pas abouti. Réessayez dans un instant.");
            setEnCours(false);
        }
    };

    const sortir = async () => {
        await deconnecter();
        navigate("/bienvenue", { replace: true });
    };

    return (
        <Ecran titre="Mon profil">
            <div className={utilisateur.photoProfil ? "profile-portrait" : "profile-portrait initiale"}><Avatar personne={utilisateur} classe="" /></div>
            <div className="profile-name">
                <h2>{utilisateur.prenom} {utilisateur.nom}</h2>
                <p className="soft">{ROLES[utilisateur.role]}</p>
            </div>
            <section className="bloc-infos" aria-labelledby="titre-infos">
                <h2 id="titre-infos" className="bloc-titre">Mes informations</h2>
                <div className="text-row"><span><Icone nom="user" /> Nom</span><strong>{utilisateur.prenom} {utilisateur.nom}</strong></div>
                <div className="text-row"><span><Icone nom="phone" /> Téléphone</span><strong>{utilisateur.telephone || "Non renseigné"}</strong></div>
                <div className="text-row"><span><Icone nom="message" /> E-mail</span><strong>{utilisateur.email}</strong></div>
                <div className="text-row"><span><Icone nom="pin" /> Adresse</span><strong>{utilisateur.adresse}, {utilisateur.codePostal} {utilisateur.ville}</strong></div>
                <Link className="bloc-lien" to="/modifier-profil">Modifier mes informations<Icone nom="chevron" /></Link>
            </section>
            {utilisateur.role === "ACCOMPAGNANT" && (
                <section className="bloc-infos" aria-labelledby="titre-proche">
                    <h2 id="titre-proche" className="bloc-titre">La personne que j'accompagne</h2>
                    {proche ? (
                        <>
                            <div className="text-row"><span><Icone nom="users" /> Nom</span><strong>{proche.prenom} {proche.nom || ""}</strong></div>
                            <div className="text-row"><span><Icone nom="pin" /> Adresse</span><strong>{proche.adresse}, {proche.codePostal} {proche.ville}</strong></div>
                            <Link className="bloc-lien" to="/proche?modifier=1">Modifier son nom ou son adresse<Icone nom="chevron" /></Link>
                        </>
                    ) : <Link className="bloc-lien" to="/proche">Ajouter la personne que j'accompagne<Icone nom="chevron" /></Link>}
                </section>
            )}
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
                <LienBouton to="/changer-role" secondaire>Changer de rôle</LienBouton>
                {utilisateur.role === "JEUNE" && (
                    <>
                        <LienBouton to="/annonce" secondaire>Modifier mon annonce</LienBouton>
                        {utilisateur.annoncePubliee && <LienBouton to={`/jeunes/${utilisateur.id}`} secondaire>Voir mon annonce</LienBouton>}
                        {utilisateur.annoncePubliee && <button className="secondary bouton-retirer" type="button" onClick={retirer}><Icone nom="trash" />Retirer mon annonce</button>}
                    </>
                )}
                <Link className="link-button" to="/charte">La charte d'entraide</Link>
                <button className="secondary" type="button" onClick={sortir}>Se déconnecter</button>
                {!confirmer && <button className="lien-danger" type="button" onClick={() => setConfirmer(true)}><Icone nom="trash" />Supprimer mon compte</button>}
            </div>
            {confirmer && (
                <section className="zone-danger" aria-labelledby="titre-suppression">
                    <h2 id="titre-suppression">Supprimer mon compte ?</h2>
                    <p>Votre profil, vos demandes, vos messages{utilisateur.role === "ACCOMPAGNANT" ? ", le profil de votre proche" : ""} et vos commentaires seront effacés. <strong>Ce n'est pas réversible.</strong></p>
                    <Message erreur={erreur} />
                    <div className="stack-actions">
                        <button className="danger" type="button" disabled={enCours} onClick={supprimer}>{enCours ? "Suppression…" : "Oui, supprimer définitivement"}</button>
                        <button className="secondary" type="button" onClick={() => setConfirmer(false)}>Non, garder mon compte</button>
                    </div>
                </section>
            )}
        </Ecran>
    );
};

export default Profil;
