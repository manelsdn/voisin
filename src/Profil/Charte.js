import { Ecran } from "../composants/Mise";
import { useSession } from "../composants/Session";
import { useNavigate } from "react-router-dom";

const Charte = () => {
    const { utilisateur } = useSession();
    const navigate = useNavigate();
    return (
        <Ecran titre={<>Une entraide <br />qui fait du bien.</>} retour classe="terms-content" nav={Boolean(utilisateur)}>
            <h3>On se respecte</h3>
            <p>On échange avec bienveillance et on respecte les horaires convenus.</p>
            <h3>On fait à son rythme</h3>
            <p>Chacun choisit les services qu'il peut rendre et les créneaux qu'il propose. On précise ensemble les besoins avant de se rencontrer.</p>
            <h3>On garde le choix</h3>
            <p>Un accompagnateur agit avec l'accord de son proche. La personne âgée reste au cœur des décisions.</p>
            <h3>On officialise simplement</h3>
            <p>Une fois la demande acceptée, on échange son numéro de téléphone pour régler les derniers détails de vive voix.</p>
            <h3>On donne librement</h3>
            <p>Le pourboire est facultatif, sans montant imposé. Il se fait directement entre le jeune et la personne âgée.</p>
            <button className="primary" type="button" onClick={() => navigate(-1)}>J'ai compris</button>
        </Ecran>
    );
};

export default Charte;
