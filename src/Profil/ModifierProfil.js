import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSession } from "../composants/Session";
import { Ecran, Message } from "../composants/Mise";
import { Icone } from "../composants/Icones";
import { envoyerLien, modifierUtilisateur } from "../services/api";

const ModifierProfil = () => {
    const { utilisateur, recharger } = useSession();
    const [erreur, setErreur] = useState("");
    const [info, setInfo] = useState("");
    const navigate = useNavigate();
    const [photo, setPhoto] = useState(null);
    const [photoErreur, setPhotoErreur] = useState("");


    const handleOnSubmit = async (event) => {
        event.preventDefault();
        const f = event.target;
        const changements = {
            prenom: f.prenom.value.trim(),
            nom: f.nom.value.trim(),
            email: f.email.value.trim().toLowerCase(),
            telephone: f.telephone.value.trim(),
            adresse: f.adresse.value.trim(),
            codePostal: f.codePostal.value.trim(),
            ville: f.ville.value.trim(),
            photoProfil: photo,
        };
        if(!photo)
            delete changements.photoProfil;
        
        if (Object.values(changements).some((v) => !v)) {
            setErreur("Tous les champs sont obligatoires.");
            return;
        }
        try {
            const emailChange = changements.email !== utilisateur.email;
            await modifierUtilisateur(utilisateur, changements);
            await recharger();
            if (emailChange) {
                await envoyerLien(changements.email);
                setErreur("");
                setInfo("Un e-mail de confirmation a été envoyé à votre nouvelle adresse.");
                return;
            }
            navigate("/profil");
        } catch (e) {
            setErreur(e.message);
        }
    };

    useEffect(() => {
        if (photo) {
            if (photo.size > 1024 * 1024) {
                setPhotoErreur("La photo de profil ne doit pas dépasser 1 Mo.");
                setPhoto(null);
                return;
            }
            else {
                setPhotoErreur("");
            }
        }
    }, [photo]);

    const apercu = photo ? URL.createObjectURL(photo) : utilisateur.photoProfil;

    return (
        <Ecran titre={<>Modifier <br />mon profil.</>} retour="/profil">
            <form className="form-stack" onSubmit={handleOnSubmit} noValidate>
                <div className="apercu-photo">
                    <div className={apercu ? "profile-portrait" : "profile-portrait initiale"}>{apercu ? <img src={apercu} alt="Aperçu de votre portrait" /> : (utilisateur.prenom || "?")[0]}</div>
                    <label htmlFor="photoProfil">Photo de profil<input type="file" onChange={(e) => setPhoto(e.target.files[0])} id="photoProfil" name="photoProfil" accept="image/*" /></label>
                </div>
                {photoErreur && <p className="erreur">{photoErreur}</p>}
                <label>Prénom<input name="prenom" defaultValue={utilisateur.prenom} maxLength={35} /></label>
                <label>Nom<input name="nom" defaultValue={utilisateur.nom} maxLength={50} /></label>
                <label>E-mail<input name="email" type="email" defaultValue={utilisateur.email} /></label>
                <label>Téléphone<input name="telephone" type="tel" defaultValue={utilisateur.telephone} /></label>
                <label>Adresse<input name="adresse" defaultValue={utilisateur.adresse} /></label>
                <div className="deux">
                    <label>Code postal<input name="codePostal" defaultValue={utilisateur.codePostal} /></label>
                    <label>Ville<input name="ville" defaultValue={utilisateur.ville} /></label>
                </div>
                <Message erreur={erreur} info={info} />
                <button className="primary" type="submit"><span>Enregistrer</span><Icone nom="check" /></button>
            </form>
        </Ecran>
    );
};

export default ModifierProfil;
