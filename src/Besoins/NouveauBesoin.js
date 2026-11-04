import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSession } from "../composants/Session";
import { Astuce, Ecran, Message, PucesServices } from "../composants/Mise";
import { Icone } from "../composants/Icones";
import Dictee, { enPhrase } from "../composants/Dictee";
import { pointDeRecherche, publierBesoin } from "../services/api";
import { analyser } from "../services/dictee";
import { JOURS, NOMS_JOURS, nomService } from "../services/constantes";

const NouveauBesoin = () => {
    const { utilisateur } = useSession();
    const [params] = useSearchParams();
    const [service, setService] = useState(params.get("service") || "");
    const [description, setDescription] = useState("");
    const [jour, setJour] = useState("");
    const [heureDebut, setHeureDebut] = useState("10:00");
    const [heureFin, setHeureFin] = useState("12:00");
    const [pour, setPour] = useState(null);
    const [manuel, setManuel] = useState({ service: !!params.get("service"), jour: false });
    const [auto, setAuto] = useState({});
    const [erreur, setErreur] = useState("");
    const [envoi, setEnvoi] = useState(false);
    const navigate = useNavigate();

    useEffect(() => { pointDeRecherche(utilisateur).then(({ personne }) => setPour(personne)); }, [utilisateur]);

    useEffect(() => {
        const trouve = analyser(description);
        const rempli = {};
        if (trouve.service && !manuel.service) {
            setService(trouve.service);
            rempli.service = trouve.service;
        }
        if (trouve.jour && !manuel.jour) {
            setJour(trouve.jour);
            rempli.jour = trouve.jour;
            if (trouve.heureDebut) {
                setHeureDebut(trouve.heureDebut);
                setHeureFin(trouve.heureFin);
                rempli.heures = `${trouve.heureDebut}-${trouve.heureFin}`;
            }
        }
        setAuto(rempli);
    }, [description, manuel]);

    if (utilisateur.role === "JEUNE") return <Ecran titre="Publier un besoin" retour><div className="notice">Les besoins sont publiés par les personnes âgées ou leurs proches.</div></Ecran>;

    const publier = async (e) => {
        e.preventDefault();
        setEnvoi(true);
        try {
            const id = await publierBesoin(utilisateur, { service, jour, heureDebut: jour ? heureDebut : "", heureFin: jour ? heureFin : "", description });
            navigate(`/besoins/${id}`, { replace: true });
        } catch (err) {
            setErreur(err.message);
            setEnvoi(false);
        }
    };

    return (
        <Ecran titre={<>De quoi avez-vous <br />besoin ?</>} retour surtitre="NOUVELLE ANNONCE">
            <p className="soft">{pour && pour.id !== utilisateur.id ? `Pour ${pour.prenom}. ` : ""}Les jeunes du quartier verront votre annonce et vous proposeront leur aide.</p>
            <form className="form-stack" onSubmit={publier} noValidate>
                <Dictee ajouter={(texte) => setDescription((avant) => enPhrase(avant, texte, 300))} libelle="Dicter mon besoin au micro" />
                <fieldset>
                    <legend>Service</legend>
                    <PucesServices actif={service} choisir={(code) => { setService(code); setManuel((m) => ({ ...m, service: true })); }} tous={false} />
                </fieldset>
                <label>Décrivez votre besoin ({description.length}/300)<textarea name="description" maxLength={300} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Par exemple : porter les courses du marché samedi matin." /></label>
                {(auto.service || auto.jour) && (
                    <p className="devine" aria-live="polite"><Icone nom="sparkles" /><span>Rempli d'après votre texte : <b>{[auto.service && nomService(auto.service), auto.jour && NOMS_JOURS[auto.jour], auto.heures].filter(Boolean).join(" · ")}</b>. Vous pouvez modifier.</span></p>
                )}
                <fieldset>
                    <legend>Quand ? (facultatif)</legend>
                    <div className="trois">
                        <label>Jour<select name="jour" value={jour} onChange={(e) => { setJour(e.target.value); setManuel((m) => ({ ...m, jour: true })); }}><option value="">Peu importe</option>{JOURS.map((j) => <option key={j} value={j}>{NOMS_JOURS[j]}</option>)}</select></label>
                        <label>Début<input name="heureDebut" type="time" value={heureDebut} disabled={!jour} onChange={(e) => { setHeureDebut(e.target.value); setManuel((m) => ({ ...m, jour: true })); }} /></label>
                        <label>Fin<input name="heureFin" type="time" value={heureFin} disabled={!jour} onChange={(e) => { setHeureFin(e.target.value); setManuel((m) => ({ ...m, jour: true })); }} /></label>
                    </div>
                </fieldset>
                <Astuce icone="pin">Votre adresse n'est jamais affichée : seule une distance approximative est visible.</Astuce>
                <Message erreur={erreur} />
                <button className="primary" type="submit" disabled={envoi}><span>{envoi ? "Publication…" : "Publier mon annonce"}</span><Icone nom="arrow" /></button>
            </form>
        </Ecran>
    );
};

export default NouveauBesoin;
