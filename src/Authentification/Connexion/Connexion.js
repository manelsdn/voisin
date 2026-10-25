import React, { useState } from "react";
import { Link } from "react-router-dom";
import { emailExiste, envoyerLien } from "../../services/api";
import { Message, Retour } from "../../composants/Mise";
import { Icone } from "../../composants/Icones";

const Connexion = () => {
    const [info, setInfo] = useState("");
    const [erreur, setErreur] = useState("");
    const [lienTest, setLienTest] = useState("");
    const [aide, setAide] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        const email = event.target.email.value.trim().toLowerCase();
        setInfo("");
        setErreur("");
        if (!/^\S+@\S+\.\S+$/.test(email)) {
            setErreur("L'adresse e-mail n'est pas valide.");
            return;
        }
        try {
            if (!(await emailExiste(email))) {
                setErreur("Aucun compte n'est associé à cet e-mail. Veuillez vous inscrire.");
                return;
            }
            const resultat = await envoyerLien(email);
            localStorage.setItem("emailForSignIn", email);
            localStorage.removeItem("inscriptionEnCours");
            setLienTest(resultat.lienTest || "");
            setInfo(resultat.lienTest ? "Mode test : aucun e-mail n'est envoyé. Cliquez sur « Ouvrir le lien reçu »." : "Un e-mail de connexion vient d'être envoyé. Vérifiez votre boîte mail et vos spams.");
        } catch (error) {
            setErreur("Erreur lors de l'envoi de l'e-mail : " + error.message);
        }
    };

    return (
        <div className="ecran vdo" id="vdo">
            <div className="corps">
                <div className="app-pad">
                    <Retour vers="/bienvenue" />
                    <div className="login-art"><img src="/assets/presentation/ensemble.jpg" alt="Un moment de partage autour d'un café" /></div>
                    <div className="login-heading">
                        <span className="mini-eyebrow">LE PLAISIR DE SE RETROUVER</span>
                        <h2>Vous revoilà !</h2>
                        <p className="soft">Recevez un lien de connexion et retrouvez votre espace.</p>
                    </div>
                    <form className="form-stack" onSubmit={handleSubmit} noValidate>
                        <label>E-mail<input type="email" name="email" autoComplete="email" placeholder="camille@exemple.fr" /></label>
                        <button className="primary" type="submit"><span>Recevoir le lien de connexion</span><Icone nom="arrow" /></button>
                    </form>
                    <Message erreur={erreur} info={info} />
                    {lienTest && <div className="stack-actions"><Link className="secondary" to={lienTest}>Ouvrir le lien reçu</Link></div>}
                    <button type="button" className="link-button" aria-expanded={aide} onClick={() => setAide(!aide)}>Vous n'avez pas reçu le lien ?</button>
                    {aide && <div className="notice">Regardez dans vos spams, puis vérifiez l'adresse saisie. Vous pouvez demander un nouveau lien avec le bouton ci-dessus : le précédent ne sert plus.</div>}
                    <div className="signin-prompt">Pas encore de compte ? <Link className="link-button" to="/inscription">Nous rejoindre</Link></div>
                </div>
            </div>
        </div>
    );
};

export default Connexion;
