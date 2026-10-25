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
                    <div className="welcome-art"><img src="/assets/illustration-rencontre-perron.png" alt="Une jeune personne rend visite à une aînée sur son perron" /></div>
                    <div className="mini-pill">LE BONHEUR D'ÊTRE UTILE</div>
                    <h2>Un petit coup <br />de main. <br />Un grand sourire.</h2>
                    <p className="soft">Entre voisins, on se simplifie la vie.<br />Et on la rend un peu plus belle.</p>
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
