import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSession } from "../composants/Session";
import { Ecran, Indice, Message } from "../composants/Mise";
import { Icone } from "../composants/Icones";
import Dictee, { enPhrase } from "../composants/Dictee";
import { analyser, servicesDans } from "../services/dictee";
import { publierAnnonce, suggestionAnnonce } from "../services/api";
import { JOURS, NOMS_JOURS, SERVICES, nomService, texteCreneau } from "../services/constantes";

const MonAnnonce = () => {
    const { utilisateur, recharger } = useSession();
    const [services, setServices] = useState(utilisateur.services || []);
    const [creneaux, setCreneaux] = useState(utilisateur.disponibilites || []);
    const [description, setDescription] = useState(utilisateur.description || "");
    const [nouveau, setNouveau] = useState({ jour: "SAMEDI", heureDebut: "09:00", heureFin: "12:00" });
    const [erreur, setErreur] = useState("");
    const [essai, setEssai] = useState(0);
    const [avantProposition, setAvantProposition] = useState(null);
    const [compris, setCompris] = useState(null);
    const navigate = useNavigate();

    if (utilisateur.role !== "JEUNE") return <Ecran titre="Mon annonce" retour="/accueil"><div className="notice">Seuls les jeunes volontaires publient une annonce.</div></Ecran>;

    const dicter = (texte) => {
        setDescription((avant) => enPhrase(avant, texte, 180));
        const trouve = analyser(texte);
        const detectes = servicesDans(texte);
        if (detectes.length) setServices((avant) => [...new Set([...avant, ...detectes])]);
        if (trouve.jour) setNouveau((n) => ({ jour: trouve.jour, heureDebut: trouve.heureDebut || n.heureDebut, heureFin: trouve.heureFin || n.heureFin }));
        setCompris(detectes.length || trouve.jour ? { services: detectes, creneau: trouve.jour ? `${NOMS_JOURS[trouve.jour]}${trouve.heureDebut ? ` ${trouve.heureDebut}-${trouve.heureFin}` : ""}` : "" } : null);
    };

    const basculer = (code) => setServices(services.includes(code) ? services.filter((c) => c !== code) : [...services, code]);

    const ajouterCreneau = () => {
        if (nouveau.heureFin <= nouveau.heureDebut) {
            setErreur("L'heure de fin doit être après l'heure de début.");
            return;
        }
        setErreur("");
        setCreneaux([...creneaux, { ...nouveau, id: "d" + Date.now() }]);
    };

    const proposer = () => {
        try {
            const mots = avantProposition !== null ? avantProposition : description;
            setDescription(suggestionAnnonce({ prenom: utilisateur.prenom, mots, services, disponibilites: creneaux }, essai));
            setAvantProposition(mots);
            setEssai(essai + 1);
            setErreur("");
        } catch (err) {
            setErreur(err.message);
        }
    };

    const refuser = () => {
        setDescription(avantProposition || "");
        setAvantProposition(null);
    };

    const publier = async (e) => {
        e.preventDefault();
        try {
            await publierAnnonce(utilisateur, { services, disponibilites: creneaux, description: description.trim() });
            await recharger();
            navigate(`/jeunes/${utilisateur.id}`);
        } catch (err) {
            setErreur(err.message);
        }
    };

    return (
        <Ecran titre="Mon annonce" retour="/accueil">
            <p className="soft">Vos services et vos créneaux, visibles dans le quartier.</p>
            <form className="form-stack" onSubmit={publier}>
                <Dictee ajouter={dicter} libelle="Dicter mon annonce au micro" />
                {compris && (
                    <p className="devine" aria-live="polite"><Icone nom="sparkles" /><span>Compris : <b>{[compris.services.map(nomService).join(", "), compris.creneau && `créneau ${compris.creneau} prêt à ajouter`].filter(Boolean).join(" · ")}</b>. Vous pouvez tout modifier.</span></p>
                )}
                <fieldset>
                    <legend>Services proposés</legend>
                    <div className="puces">
                        {SERVICES.map((s) => (
                            <button key={s.code} type="button" className="puce" aria-pressed={services.includes(s.code)} onClick={() => basculer(s.code)}><img src={s.image} alt="" />{s.nom}</button>
                        ))}
                    </div>
                </fieldset>
                <fieldset>
                    <legend>Mes créneaux</legend>
                    {creneaux.length === 0 && <p className="soft">Aucun créneau pour le moment.</p>}
                    <ul className="creneaux">
                        {creneaux.map((c) => (
                            <li key={c.id}>{texteCreneau(c)} <button type="button" onClick={() => setCreneaux(creneaux.filter((x) => x.id !== c.id))}>Retirer</button></li>
                        ))}
                    </ul>
                    <div className="trois">
                        <label>Jour<select name="jour" value={nouveau.jour} onChange={(e) => setNouveau({ ...nouveau, jour: e.target.value })}>{JOURS.map((j) => <option key={j} value={j}>{NOMS_JOURS[j]}</option>)}</select></label>
                        <label>Début<input name="heureDebut" type="time" value={nouveau.heureDebut} onChange={(e) => setNouveau({ ...nouveau, heureDebut: e.target.value })} /></label>
                        <label>Fin<input name="heureFin" type="time" value={nouveau.heureFin} onChange={(e) => setNouveau({ ...nouveau, heureFin: e.target.value })} /></label>
                    </div>
                    <button type="button" className="secondary" onClick={ajouterCreneau}>Ajouter ce créneau</button>
                </fieldset>
                <label>Présentation courte ({description.length}/180)<textarea name="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Exemple : étudiant, disponible après les cours pour les courses et l'informatique." /></label>
                <div className="deux">
                    <button type="button" className="secondary" onClick={proposer}><Icone nom="sparkles" />{avantProposition !== null ? "Autre proposition" : "Proposer un texte"}</button>
                    {avantProposition !== null && <button type="button" className="secondary" onClick={refuser}>Garder mon texte</button>}
                </div>
                {avantProposition !== null && <p className="soft"><small>Proposition modifiable : relisez-la avant de publier.</small></p>}
                <Message erreur={erreur} />
                <button className="primary" type="submit"><span>Publier mon annonce</span><Icone nom="arrow" /></button>
            </form>
            <Indice icone="pin">L'adresse sert à calculer la distance avec les personnes du quartier. Elle n'est jamais affichée.</Indice>
        </Ecran>
    );
};

export default MonAnnonce;
