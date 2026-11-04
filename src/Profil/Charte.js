import { Ecran } from "../composants/Mise";
import { useSession } from "../composants/Session";
import { useNavigate } from "react-router-dom";

const Charte = () => {
    const { utilisateur } = useSession();
    const navigate = useNavigate();
    return (
        <Ecran titre={<>Une entraide <br />qui fait du bien.</>} retour classe="terms-content" nav={Boolean(utilisateur)}>
            <h2 className="sous-titre">On se respecte</h2>
            <p>On échange avec bienveillance et on respecte les horaires convenus.</p>
            <h2 className="sous-titre">On fait à son rythme</h2>
            <p>Chacun choisit les services qu'il peut rendre et les créneaux qu'il propose. On précise ensemble les besoins avant de se rencontrer.</p>
            <h2 className="sous-titre">On garde le choix</h2>
            <p>Un accompagnateur agit avec l'accord de son proche. La personne âgée reste au cœur des décisions.</p>
            <h2 className="sous-titre">On officialise simplement</h2>
            <p>Une fois la demande acceptée, on échange son numéro de téléphone pour régler les derniers détails de vive voix.</p>
            <h2 className="sous-titre">On donne librement</h2>
            <p>Le pourboire est facultatif, sans montant imposé. Il se fait directement entre le jeune et la personne âgée.</p>
            <button className="primary" type="button" onClick={() => navigate(-1)}>J'ai compris</button>
        </Ecran>
    );
};

export default Charte;
