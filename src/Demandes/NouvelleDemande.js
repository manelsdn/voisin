import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useSession } from "../composants/Session";
import { Astuce, BanniereService, Ecran, Message } from "../composants/Mise";
import { Icone } from "../composants/Icones";
import Dictee, { enPhrase } from "../composants/Dictee";
import { changerStatutBesoin, envoyerDemande, lireBesoin, lireUtilisateur, pointDeRecherche, televerserPhotoDemande } from "../services/api";
import { prochaineDate, texteDate } from "../services/geo";
import { nomService, texteCreneau } from "../services/constantes";

const NouvelleDemande = () => {
    const { id } = useParams();
    const { utilisateur } = useSession();
    const [jeune, setJeune] = useState(null);
    const [beneficiaire, setBeneficiaire] = useState(null);
    const [creneauId, setCreneauId] = useState("");
    const [service, setService] = useState("");
    const [erreur, setErreur] = useState("");
    const [envoi, setEnvoi] = useState(false);
    const [photo, setPhoto] = useState(null);
    const [apercu, setApercu] = useState("");
    const [params] = useSearchParams();
    const serviceDemande = params.get("service");
    const besoinId = params.get("besoin");
    const [besoin, setBesoin] = useState(null);
    const [precisions, setPrecisions] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        const charger = async () => {
            const j = await lireUtilisateur(id);
            setJeune(j);
            setCreneauId(j && j.disponibilites && j.disponibilites[0] ? j.disponibilites[0].id : "");
            setService(j && j.services ? (j.services.includes(serviceDemande) ? serviceDemande : j.services[0]) : "");
            setBeneficiaire((await pointDeRecherche(utilisateur)).personne);
            if (besoinId) {
                const b = await lireBesoin(besoinId).catch(() => null);
                if (b && b.auteurId === utilisateur.id) {
                    setBesoin(b);
                    setPrecisions(b.description || "");
                }
            }
        };
        charger();
    }, [id, utilisateur, serviceDemande, besoinId]);

    if (utilisateur.role === "JEUNE") return <Ecran titre="Demande" retour><div className="notice">Les demandes sont envoyées par les personnes âgées ou leurs proches.</div></Ecran>;
    if (!jeune || !beneficiaire) return <Ecran retour><p className="soft">Chargement…</p></Ecran>;

    const creneau = (jeune.disponibilites || []).find((c) => c.id === creneauId);

    const choisirPhoto = (e) => {
        const fichier = e.target.files[0] || null;
        if (apercu) URL.revokeObjectURL(apercu);
        setPhoto(fichier);
        setApercu(fichier ? URL.createObjectURL(fichier) : "");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setEnvoi(true);
        try {
            const urlPhoto = photo ? await televerserPhotoDemande(utilisateur, photo) : null;
            const demandeId = await envoyerDemande({
                demandeur: utilisateur,
                beneficiaire,
                jeune,
                service,
                creneau,
                description: e.target.description.value,
                photo: urlPhoto
            });
            if (besoin) await changerStatutBesoin(besoin, utilisateur, "POURVUE", jeune.id).catch(() => null);
            navigate(`/demande-envoyee/${demandeId}`, { replace: true });
        } catch (err) {
            setErreur(err.message);
            setEnvoi(false);
        }
    };

    return (
        <Ecran titre={<>Organisons ce <br />coup de main.</>} retour>
            <BanniereService code={service} />
            <p className="soft">Avec {jeune.prenom}{beneficiaire.id !== utilisateur.id ? ` · pour ${beneficiaire.prenom}` : ""}</p>
            <form className="form-stack" onSubmit={handleSubmit} noValidate>
                {beneficiaire.id !== utilisateur.id && <label>Pour<input name="beneficiaire" value={beneficiaire.prenom} readOnly /></label>}
                <label>Service<select name="service" value={service} onChange={(e) => setService(e.target.value)}>{(jeune.services || []).map((c) => <option key={c} value={c}>{nomService(c)}</option>)}</select></label>
                <label>Créneau proposé par {jeune.prenom}<select name="creneau" value={creneauId} onChange={(e) => setCreneauId(e.target.value)}>{(jeune.disponibilites || []).map((c) => <option key={c.id} value={c.id}>{texteCreneau(c)}</option>)}</select></label>
                {creneau && <p className="soft"><small>Prochaine date : {texteDate(prochaineDate(creneau.jour))}</small></p>}
                <Dictee ajouter={(texte) => setPrecisions((avant) => enPhrase(avant, texte, 400))} libelle="Dicter mes précisions" />
                <label>Quelques précisions<textarea name="description" maxLength={400} value={precisions} onChange={(e) => setPrecisions(e.target.value)} placeholder="Par exemple : faire les courses du quartier, environ une heure." /></label>
                <label>Joindre une photo du besoin (facultatif)<input name="photo" type="file" accept="image/*" onChange={choisirPhoto} /></label>
                {apercu && <img className="demande-photo" src={apercu} alt="Aperçu du besoin à montrer" />}
                <Astuce>Le pourboire reste libre et se donne directement entre vous.</Astuce>
                <Astuce icone="phone">Votre numéro sera visible par {jeune.prenom} seulement si la demande est acceptée.</Astuce>
                <Message erreur={erreur} />
                <button className="primary" type="submit" disabled={envoi}><span>Envoyer la demande</span><Icone nom="arrow" /></button>
            </form>
        </Ecran>
    );
};

export default NouvelleDemande;
