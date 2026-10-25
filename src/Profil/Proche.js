import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSession } from "../composants/Session";
import { Ecran, Indice, Message } from "../composants/Mise";
import { ajouterProche, listerProches } from "../services/api";

const Proche = () => {
    const { utilisateur } = useSession();
    const [proche, setProche] = useState(undefined);
    const [erreur, setErreur] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        listerProches(utilisateur.id).then((l) => setProche(l[0] || null));
    }, [utilisateur]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const f = e.target;
        const donnees = {
            prenom: f.prenom.value.trim(),
            adresse: f.adresse.value.trim(),
            codePostal: f.codePostal.value.trim(),
            ville: f.ville.value.trim()
        };
        if (Object.values(donnees).some((v) => !v)) {
            setErreur("Le prénom et l'adresse de votre proche sont obligatoires.");
            return;
        }
        if (!f.accord.checked) {
            setErreur("Votre proche doit être d'accord pour que vous organisiez ses demandes.");
            return;
        }
        try {
            await ajouterProche(utilisateur, donnees);
            navigate("/accueil");
        } catch (err) {
            setErreur(err.message);
        }
    };

    if (utilisateur.role !== "ACCOMPAGNANT") return <Ecran titre="Mon proche" retour="/profil"><div className="notice">Cette page est réservée aux proches accompagnateurs.</div></Ecran>;
    if (proche === undefined) return <Ecran titre="Mon proche"><p className="soft">Chargement…</p></Ecran>;

    return (
        <Ecran titre={<>Vous êtes là <br />pour votre proche.</>} retour="/accueil">
            {proche ? (
                <>
                    <div className="detail-box">
                        <span className="mini-eyebrow">MON PROCHE</span>
                        <h3>{proche.prenom}</h3>
                        <p>{proche.adresse}, {proche.codePostal} {proche.ville}</p>
                    </div>
                    <Indice icone="pin">Les recherches utilisent l'adresse de {proche.prenom}. Un seul proche par compte pour le moment.</Indice>
                </>
            ) : (
                <>
                    <p className="soft">Votre proche n'a pas besoin de compte. Vous gérez les demandes et les échanges avec son accord.</p>
                    <form className="form-stack" onSubmit={handleSubmit} noValidate>
                        <label>Prénom de votre proche<input name="prenom" maxLength={35} placeholder="Madeleine" /></label>
                        <label>Son adresse<input name="adresse" placeholder="8 rue Moncey" /></label>
                        <div className="deux">
                            <label>Code postal<input name="codePostal" placeholder="69003" /></label>
                            <label>Ville<input name="ville" placeholder="Lyon" /></label>
                        </div>
                        <label className="check-label"><input type="checkbox" name="accord" />Mon proche est d'accord pour que j'organise ses demandes.</label>
                        <Message erreur={erreur} />
                        <button className="primary" type="submit">Enregistrer</button>
                    </form>
                </>
            )}
        </Ecran>
    );
};

export default Proche;
