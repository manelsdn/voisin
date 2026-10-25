import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { emailExiste, envoyerLien } from "../../services/api";
import { Indice, Message, Retour } from "../../composants/Mise";
import { DessinRole, Icone } from "../../composants/Icones";
import { geocoder } from "../../services/geo";

const ROLES_CARTES = [
    { code: "JEUNE", titre: "Je donne un coup de main", texte: "Des services et de belles rencontres." },
    { code: "ACCOMPAGNANT", titre: "J'accompagne un proche", texte: "Je m'occupe de ses demandes." },
    { code: "SENIOR", titre: "Je cherche de l'aide", texte: "Un peu d'aide dans mon quotidien." }
];

const Inscription = () => {
    const [etape, setEtape] = useState("role");
    const [role, setRole] = useState("");
    const [erreur, setErreur] = useState("");
    const [envoi, setEnvoi] = useState(false);
    const navigate = useNavigate();

    const continuer = () => {
        if (!role) {
            setErreur("Choisissez votre rôle pour continuer.");
            return;
        }
        setErreur("");
        setEtape("details");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const f = e.target;
        const donnees = {
            role,
            prenom: f.prenom.value.trim(),
            nom: f.nom.value.trim(),
            email: f.email.value.trim().toLowerCase(),
            telephone: f.telephone.value.trim(),
            adresse: f.adresse.value.trim(),
            codePostal: f.codePostal.value.trim(),
            ville: f.ville.value.trim()
        };
        if (Object.values(donnees).some((v) => !v)) {
            setErreur("Tous les champs sont obligatoires.");
            return;
        }
        if (!/^\S+@\S+\.\S+$/.test(donnees.email)) {
            setErreur("L'adresse e-mail n'est pas valide.");
            return;
        }
        if (!/^0[1-9](\s?\d{2}){4}$/.test(donnees.telephone)) {
            setErreur("Le numéro de téléphone doit avoir 10 chiffres, par exemple 06 12 34 56 78.");
            return;
        }

        setEnvoi(true);
        try {
            if (await emailExiste(donnees.email)) {
                setErreur("Un compte existe déjà pour cet e-mail. Connectez-vous ou saisissez un autre e-mail.");
                setEnvoi(false);
                return;
            }
            // corrigé : on passe direct l'objet donnees complet sinon geocoder recevait des trucs undefined et ça plantait
            const position = await geocoder(donnees);
            // corrigé : on fusionne direct les coordonnées GPS avec le reste pour pas devoir recalculer plus tard
            const donneesCompletes = { ...donnees, ...position };
            localStorage.setItem("inscriptionEnCours", JSON.stringify(donneesCompletes));
            const resultat = await envoyerLien(donneesCompletes.email);
            // corrigé : on stocke le tout avec latitude et longitude pour la suite de l'inscription
            localStorage.setItem("inscriptionEnCours", JSON.stringify(donneesCompletes));
            localStorage.setItem("emailForSignIn", donneesCompletes.email);
            navigate("/finaliser-inscription", { state: resultat });
        } catch (error) {
            if (error.type && error.type === "geocodage") {
                console.log(error);
                setErreur(error.message);
            } else {
                setErreur("Erreur lors de l'envoi du lien : " + error.message);
            }
            setEnvoi(false);
        }
    };

    const indices = {
        ACCOMPAGNANT: "Votre proche n'a pas besoin d'utiliser l'app. Vous organisez les services avec son accord.",
        SENIOR: "Vous restez décisionnaire : vous faites votre propre demande, quand vous le souhaitez."
    };

    return (
        <div className="ecran vdo" id="vdo">
            <div className="corps">
                <div className="app-pad">
                    <Retour vers="/bienvenue" action={etape === "details" ? () => setEtape("role") : null} texte={etape === "role" ? "ÉTAPE 1 SUR 3" : "ÉTAPE 2 SUR 3"} />
                    <div className="step-line"><i className="on"></i><i className={etape === "details" ? "on" : ""}></i><i></i></div>
                    {etape === "role" ? (
                        <>
                            <span className="mini-eyebrow">FAISONS CONNAISSANCE</span>
                            <h2>Et vous, qu'est-ce <br />qui vous amène ?</h2>
                            <p className="soft signup-copy">À chacun sa façon de créer du lien.</p>
                            <div className="role-list">
                                {ROLES_CARTES.map((r) => (
                                    <button key={r.code} type="button" className="role-card" aria-pressed={role === r.code} onClick={() => setRole(r.code)}>
                                        <DessinRole role={r.code} />
                                        <span><strong>{r.titre}</strong><small>{r.texte}</small></span>
                                        <span className="radio"></span>
                                    </button>
                                ))}
                            </div>
                            <Indice>{indices[role] || "Une communauté où chaque petit geste compte."}</Indice>
                            <Message erreur={erreur} />
                            <div className="signup-bottom">
                                <button className="primary" type="button" onClick={continuer}><span>Continuer</span><Icone nom="arrow" /></button>
                                <div className="signin-prompt">Déjà un compte ? <Link className="link-button" to="/connexion">Se connecter</Link></div>
                            </div>
                        </>
                    ) : (
                        <>
                            <h2>Créons <br />votre accès.</h2>
                            <p className="soft">Un lien de connexion vous sera envoyé par e-mail. Pas de mot de passe à retenir.</p>
                            <form className="form-stack" onSubmit={handleSubmit} noValidate>
                                <label>Prénom<input name="prenom" autoComplete="given-name" maxLength={35} placeholder="Camille" /></label>
                                <label>Nom<input name="nom" autoComplete="family-name" maxLength={50} placeholder="Martin" /></label>
                                <label>E-mail<input name="email" type="email" autoComplete="email" placeholder="camille@exemple.fr" /></label>
                                <label>Téléphone<input name="telephone" type="tel" autoComplete="tel" placeholder="06 12 34 56 78" /></label>
                                <label>{role === "ACCOMPAGNANT" ? "Votre adresse" : "Adresse"}<input name="adresse" autoComplete="street-address" placeholder="12 rue Paul Bert" /></label>
                                <div className="deux">
                                    <label>Code postal<input name="codePostal" autoComplete="postal-code" placeholder="69003" /></label>
                                    <label>Ville<input name="ville" autoComplete="address-level2" placeholder="Lyon" /></label>
                                </div>
                                <Message erreur={erreur} />
                                <button className="primary" type="submit" disabled={envoi}><span>{envoi ? "Envoi…" : "Recevoir le lien"}</span><Icone nom="arrow" /></button>
                            </form>
                            <Indice icone="pin">Votre adresse sert à calculer les distances. Elle n'est jamais affichée. Votre téléphone reste privé jusqu'à un rendez-vous accepté.</Indice>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Inscription;
