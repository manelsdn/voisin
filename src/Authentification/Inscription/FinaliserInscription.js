import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Indice, Retour } from "../../composants/Mise";
import { Icone } from "../../composants/Icones";

const FinaliserInscription = () => {
    const { state } = useLocation();
    const email = localStorage.getItem("emailForSignIn") || "";

    return (
        <div className="ecran vdo" id="vdo">
            <div className="corps">
                <div className="app-pad">
                    <Retour vers="/inscription" texte="ÉTAPE 3 SUR 3" />
                    <div className="step-line"><i className="on"></i><i className="on"></i><i className="on"></i></div>
                    <div className="success-icon"><Icone nom="message" /></div>
                    <div className="profile-name">
                        <span className="mini-eyebrow">VÉRIFICATION</span>
                        <h2>Vérifiez votre e-mail.</h2>
                        {!(state && state.lienTest) && <p className="soft">Nous avons envoyé un lien à {email || "votre adresse e-mail"}.</p>}
                    </div>
                    {state && state.lienTest ? (
                        <div className="notice">Mode test : aucun e-mail n'est envoyé. Cliquez sur « Ouvrir le lien reçu ».</div>
                    ) : (
                        <div className="notice">Ouvrez le lien reçu pour terminer. Si vous ne voyez rien, regardez dans vos spams.</div>
                    )}
                    <div className="stack-actions">
                        {state && state.lienTest && <Link className="primary" to={state.lienTest}><span>Ouvrir le lien reçu</span><Icone nom="arrow" /></Link>}
                        <Link className="secondary" to="/connexion">Retour à la connexion</Link>
                    </div>
                    <Indice>Pas de mot de passe : le lien suffit pour entrer dans votre espace.</Indice>
                </div>
            </div>
        </div>
    );
};

export default FinaliserInscription;
