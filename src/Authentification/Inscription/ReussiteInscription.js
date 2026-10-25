import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { creerUtilisateur, estLien, validerLien } from "../../services/api";
import { useSession } from "../../composants/Session";

const ReussiteInscription = () => {
    const navigate = useNavigate();
    const { recharger } = useSession();
    const [erreur, setErreur] = useState("");
    const [demanderEmail, setDemanderEmail] = useState(false);
    const lance = useRef(false);

    const terminer = useCallback(async (email) => {
        try {
            const uid = await validerLien(window.location.href, email);
            const brut = localStorage.getItem("inscriptionEnCours");
            const inscription = brut ? JSON.parse(brut) : null;
            let utilisateur = await recharger(uid);
            if (!utilisateur && inscription && inscription.email === email) {
                await creerUtilisateur(uid, inscription);
                utilisateur = await recharger(uid);
            }
            localStorage.removeItem("inscriptionEnCours");
            localStorage.removeItem("emailForSignIn");
            if (!utilisateur) {
                setErreur("Aucun compte n'est associé à cet e-mail. Veuillez vous inscrire.");
                return;
            }
            navigate(utilisateur.role === "ACCOMPAGNANT" && inscription ? "/proche" : "/accueil", { replace: true });
        } catch (e) {
            setErreur(e.message.includes("introuvable") ? e.message : "Le lien n'est plus valide. Demandez un nouveau lien.");
        }
    }, [navigate, recharger]);

    useEffect(() => {
        if (lance.current) return;
        lance.current = true;
        const href = window.location.href;
        if (!estLien(href)) {
            setErreur("Le lien est absent ou invalide. Demandez un nouveau lien de connexion.");
            return;
        }
        const params = new URLSearchParams(window.location.search);
        const email = params.get("email") || localStorage.getItem("emailForSignIn");
        if (email) terminer(email);
        else setDemanderEmail(true);
    }, [terminer]);

    return (
        <div className="ecran vdo" id="vdo">
            <div className="corps">
                <div className="app-pad">
                    <div className="login-art"><img src="/assets/presentation/ensemble.jpg" alt="" /></div>
                    <div className="login-heading">
                        <span className="mini-eyebrow">VALIDATION</span>
                        {erreur ? <h2>Oups.</h2> : demanderEmail ? <h2>Confirmez votre e-mail.</h2> : <h2>Validation en cours…</h2>}
                    </div>
                    {erreur ? (
                        <>
                            <p className="erreur" role="alert">{erreur}</p>
                            <div className="stack-actions"><Link className="primary" to="/connexion">Retour à la connexion</Link></div>
                        </>
                    ) : demanderEmail && (
                        <form className="form-stack" onSubmit={(e) => { e.preventDefault(); setDemanderEmail(false); terminer(e.target.email.value.trim().toLowerCase()); }}>
                            <label>E-mail<input name="email" type="email" required placeholder="camille@exemple.fr" /></label>
                            <button className="primary" type="submit">Valider</button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReussiteInscription;
