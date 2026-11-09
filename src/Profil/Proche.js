import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSession } from "../composants/Session";
import { Ecran, Indice, Message } from "../composants/Mise";
import { ajouterProche, listerProches, modifierProche } from "../services/api";
import ChampAdresse from "../composants/Adresse";

const Proche = () => {
    const { utilisateur } = useSession();
    const [proche, setProche] = useState(undefined);
    const [params] = useSearchParams();
    const [erreur, setErreur] = useState("");
    const [edition, setEdition] = useState(params.get("modifier") === "1");
    const [info, setInfo] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        listerProches(utilisateur.id).then((l) => setProche(l[0] || null));
    }, [utilisateur]);

    const modifier = async (e) => {
        e.preventDefault();
        const f = e.target;
        const donnees = { prenom: f.prenom.value.trim(), nom: f.nom.value.trim(), adresse: f.adresse.value.trim(), codePostal: f.codePostal.value.trim(), ville: f.ville.value.trim() };
        try {
            await modifierProche(utilisateur, proche, donnees);
            setProche((await listerProches(utilisateur.id))[0] || null);
            setErreur("");
            setEdition(false);
            setInfo(`Les informations de ${donnees.prenom} sont à jour.`);
        } catch (err) {
            setErreur(err.message);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const f = e.target;
        const donnees = {
            prenom: f.prenom.value.trim(),
            nom: f.nom.value.trim(),
            adresse: f.adresse.value.trim(),
            codePostal: f.codePostal.value.trim(),
            ville: f.ville.value.trim()
        };
        if ([donnees.prenom, donnees.adresse, donnees.codePostal, donnees.ville].some((v) => !v)) {
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
        <Ecran titre="Mon proche" retour={proche ? "/accueil" : undefined}>
            {proche && edition ? (
                <form className="form-stack" onSubmit={modifier} noValidate>
                    <div className="deux">
                        <label>Prénom de votre proche<input name="prenom" maxLength={35} defaultValue={proche.prenom} /></label>
                        <label>Nom<input name="nom" maxLength={50} defaultValue={proche.nom || ""} /></label>
                    </div>
                    <ChampAdresse libelle="Son adresse" initial={proche} />
                    <Indice icone="pin">L'adresse sert à trouver les jeunes proches de chez {proche.prenom}. Elle n'est jamais affichée aux autres.</Indice>
                    <Message erreur={erreur} />
                    <button className="primary" type="submit">Enregistrer les modifications</button>
                    <button className="secondary" type="button" onClick={() => { setEdition(false); setErreur(""); }}>Annuler</button>
                </form>
            ) : proche ? (
                <>
                    {info && <div className="notice" role="status">{info}</div>}
                    <div className="detail-box">
                        <span className="mini-eyebrow">MON PROCHE</span>
                        <h2 className="sous-titre">{proche.prenom} {proche.nom || ""}</h2>
                        <p>{proche.adresse}, {proche.codePostal} {proche.ville}</p>
                    </div>
                    <button className="secondary" type="button" onClick={() => { setEdition(true); setInfo(""); }}>Modifier son prénom ou son adresse</button>
                    <Indice icone="pin">Les recherches utilisent l'adresse de {proche.prenom}. Un seul proche par compte pour le moment.</Indice>
                </>
            ) : (
                <>
                    <div className="notice notice-proche"><strong>Avant de commencer, ajoutez la personne que vous aidez.</strong> Les jeunes sont cherchés autour de chez elle.</div>
                    <p className="soft">Votre proche n'a pas besoin de compte. Vous gérez les demandes et les échanges avec son accord.</p>
                    <form className="form-stack" onSubmit={handleSubmit} noValidate>
                        <div className="deux">
                            <label>Prénom de votre proche<input name="prenom" maxLength={35} placeholder="Madeleine" /></label>
                            <label>Nom<input name="nom" maxLength={50} placeholder="Moreau" /></label>
                        </div>
                        <ChampAdresse libelle="Son adresse" exemple="8 rue Moncey" />
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
