import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSession } from "../composants/Session";
import { Astuce, ChoixHeure, Ecran, Message, PucesServices } from "../composants/Mise";
import { Icone } from "../composants/Icones";
import Dictee, { enPhrase } from "../composants/Dictee";
import { dateDuJour, pointDeRecherche, publierBesoin } from "../services/api";
import { analyser } from "../services/dictee";
import { JOURS, SOUS_SERVICES, nomService, texteJour } from "../services/constantes";

const quinzeJours = () => {
    const premier = new Date(`${dateDuJour()}T12:00:00`);
    return Array.from({ length: 21 }, (_, i) => {
        const d = new Date(premier);
        d.setDate(d.getDate() + i);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    });
};

const jourDe = (iso) => JOURS[(new Date(`${iso}T12:00:00`).getDay() + 6) % 7];

const NouveauBesoin = () => {
    const { utilisateur } = useSession();
    const [params] = useSearchParams();
    const [service, setService] = useState(params.get("service") || "");
    const [description, setDescription] = useState("");
    const [date, setDate] = useState("");
    const [sous, setSous] = useState("");
    const [heureDebut, setHeureDebut] = useState("");
    const [heureFin, setHeureFin] = useState("");
    const [pour, setPour] = useState(null);
    const [manuel, setManuel] = useState({ service: !!params.get("service"), jour: false, sous: false });
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
        if (!manuel.sous && trouve.sous && (!manuel.service || trouve.service === service)) {
            setSous(trouve.sous);
            rempli.sous = trouve.sous;
        }
        if (trouve.date && !manuel.jour) {
            setDate(trouve.date);
            rempli.date = trouve.date;
            if (trouve.heureDebut) {
                setHeureDebut(trouve.heureDebut);
                setHeureFin(trouve.heureFin);
                rempli.heures = `${trouve.heureDebut}-${trouve.heureFin}`;
            }
        }
        setAuto(rempli);
    }, [description, manuel, service]);

    if (utilisateur.role === "JEUNE") return <Ecran titre="Publier un besoin" retour><div className="notice">Les besoins sont publiés par les personnes âgées ou leurs proches.</div></Ecran>;

    const publier = async (e) => {
        e.preventDefault();
        setEnvoi(true);
        try {
            const jour = date ? jourDe(date) : "";
            const id = await publierBesoin(utilisateur, { service, sousService: sous, date, jour, heureDebut: jour ? heureDebut : "", heureFin: jour ? heureFin : "", description });
            navigate(`/besoins/${id}`, { replace: true });
        } catch (err) {
            setErreur(err.message);
            setEnvoi(false);
        }
    };

    return (
        <Ecran titre={<>De quoi avez-vous <br />besoin ?</>} retour>
            <p className="soft">{pour && pour.id !== utilisateur.id ? `Pour ${pour.prenom}. ` : ""}Les jeunes du quartier verront votre annonce et vous proposeront leur aide.</p>
            <form className="form-stack" onSubmit={publier} noValidate>
                <Dictee ajouter={(texte) => setDescription((avant) => enPhrase(avant, texte, 300))} libelle="Dicter mon besoin au micro" />
                <fieldset>
                    <legend>Service</legend>
                    <PucesServices actif={service} choisir={(code) => { setService(code); setSous(""); setManuel((m) => ({ ...m, service: true, sous: false })); }} tous={false} />
                </fieldset>
                {(SOUS_SERVICES[service] || []).length > 0 && (
                    <fieldset>
                        <legend>Plus précisément ? (facultatif)</legend>
                        <div className="sous-services" role="group" aria-label="Précision du besoin">
                            {SOUS_SERVICES[service].map((nom) => <button key={nom} type="button" className="puce" aria-pressed={sous === nom} onClick={() => { setSous(sous === nom ? "" : nom); setManuel((m) => ({ ...m, sous: true })); }}>{nom}</button>)}
                        </div>
                    </fieldset>
                )}
                <label>Décrivez votre besoin ({description.length}/300)<textarea name="description" maxLength={300} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Par exemple : porter les courses du marché samedi matin." /></label>
                {(auto.service || auto.sous || auto.date) && (
                    <p className="devine" aria-live="polite"><Icone nom="sparkles" /><span>Rempli d'après votre texte : <b>{[auto.service && nomService(auto.service), auto.sous, auto.date && texteJour(auto.date), auto.heures].filter(Boolean).join(" · ")}</b>. Vous pouvez modifier.</span></p>
                )}
                <fieldset>
                    <legend>Quand ? (facultatif)</legend>
                    <div className="trois">
                        <label>Date<select name="date" value={date} onChange={(e) => { setDate(e.target.value); setManuel((m) => ({ ...m, jour: true })); }}><option value="">Peu importe</option>{[...new Set([...(date ? [date] : []), ...quinzeJours()])].sort().map((d) => <option key={d} value={d}>{d === dateDuJour() ? `Aujourd'hui, ${texteJour(d).toLowerCase()}` : texteJour(d)}</option>)}</select></label>
                        <ChoixHeure libelle="Début" name="heureDebut" value={heureDebut} disabled={!date} onChange={(e) => { setHeureDebut(e.target.value); setManuel((m) => ({ ...m, jour: true })); }} />
                        <ChoixHeure libelle="Fin" name="heureFin" value={heureFin} disabled={!date} onChange={(e) => { setHeureFin(e.target.value); setManuel((m) => ({ ...m, jour: true })); }} />
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
