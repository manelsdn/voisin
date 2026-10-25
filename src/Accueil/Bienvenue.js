import { Link, Navigate } from "react-router-dom";
import { useSession } from "../composants/Session";
import { LienBouton } from "../composants/Mise";

const Bienvenue = () => {
    const { utilisateur } = useSession();
    if (utilisateur) return <Navigate to="/accueil" replace />;
    return (
        <div className="ecran vdo" id="vdo">
            <div className="corps">
                <div className="welcome">
                    <img className="app-logo" src="/assets/logo-voisin-dor.svg" alt="Voisin d'Or" />
                    <div className="welcome-art"><img src="/assets/presentation/accueil.jpg" alt="Une jeune personne rend visite à une aînée sur son perron" /></div>
                    <div className="mini-pill">L'ENTRAIDE ENTRE GÉNÉRATIONS</div>
                    <h2 className="titre-accent">Petits services. <br /><em>Grands liens.</em></h2>
                    <p className="welcome-intro">Un jeune de votre quartier vous donne un coup de main pour les petites choses du quotidien.</p>
                    <ol className="welcome-etapes">
                        <li><b>1</b><span><strong>Je choisis un service</strong>et un jeune près de chez moi.</span></li>
                        <li><b>2</b><span><strong>Il accepte ma demande</strong>et on échange nos numéros.</span></li>
                        <li><b>3</b><span><strong>On se rencontre</strong>le pourboire reste libre.</span></li>
                    </ol>
                    <div className="welcome-actions">
                        <LienBouton to="/inscription" fleche>C'est parti !</LienBouton>
                        <div className="signin-prompt">Déjà parmi nous ? <Link className="link-button" to="/connexion">Se connecter</Link></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Bienvenue;
