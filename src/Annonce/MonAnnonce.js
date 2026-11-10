import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSession } from "../composants/Session";
import { ChoixHeure, Ecran, Indice, Message } from "../composants/Mise";
import { Icone } from "../composants/Icones";
import Dictee, { enPhrase } from "../composants/Dictee";
import { analyser, servicesDans } from "../services/dictee";
import { publierAnnonce, retirerAnnonce, suggestionAnnonce } from "../services/api";
import { JOURS, SERVICES, aujourdhuiIso, creneauxActifs, nomService, texteCreneau, texteJour } from "../services/constantes";

const VIDE = { date: "", heureDebut: "", heureFin: "" };

const prochainsJours = () => {
    const d = new Date(`${aujourdhuiIso()}T12:00:00`);
    return Array.from({ length: 28 }, (_, i) => {
        const x = new Date(d);
        x.setDate(x.getDate() + i);
        return aujourdhuiIso(x);
    });
};

const jourDe = (iso) => JOURS[(new Date(`${iso}T12:00:00`).getDay() + 6) % 7];

const memeCreneau = (a, b) => (a.date || "") === (b.date || "") && a.jour === b.jour && a.heureDebut === b.heureDebut && a.heureFin === b.heureFin;

const MonAnnonce = () => {
    const { utilisateur, recharger } = useSession();
    const [services, setServices] = useState(utilisateur.services || []);
    const [creneaux, setCreneaux] = useState(creneauxActifs(utilisateur.disponibilites));
    const [description, setDescription] = useState(utilisateur.description || "");
    const [nouveau, setNouveau] = useState(VIDE);
    const [erreur, setErreur] = useState("");
    const [essai, setEssai] = useState(0);
    const [avantProposition, setAvantProposition] = useState(null);
    const [compris, setCompris] = useState(null);
    const [info, setInfo] = useState("");
    const navigate = useNavigate();

    if (utilisateur.role !== "JEUNE") return <Ecran titre="Mon annonce" retour="/accueil"><div className="notice">Seuls les jeunes volontaires publient une annonce.</div></Ecran>;

    const dicter = (texte) => {
        setDescription((avant) => enPhrase(avant, texte, 180));
        const trouve = analyser(texte);
        const detectes = servicesDans(texte);
        if (detectes.length) setServices((avant) => [...new Set([...avant, ...detectes])]);
        if (trouve.date) setNouveau({ date: trouve.date, heureDebut: trouve.heureDebut || "", heureFin: trouve.heureFin || "" });
        setCompris(detectes.length || trouve.date ? { services: detectes, creneau: trouve.date ? `${texteJour(trouve.date)}${trouve.heureDebut ? ` ${trouve.heureDebut}-${trouve.heureFin}` : ""}` : "" } : null);
    };

    const basculer = (code) => setServices(services.includes(code) ? services.filter((c) => c !== code) : [...services, code]);

    const changerNouveau = (champ) => (e) => setNouveau({ ...nouveau, [champ]: e.target.value });

    const rempli = Boolean(nouveau.date || nouveau.heureDebut || nouveau.heureFin);

    const creneauSaisi = () => {
        if (!nouveau.date) throw new Error("Choisissez une date.");
        if (nouveau.date < aujourdhuiIso()) throw new Error("Cette date est déjà passée.");
        if (!nouveau.heureDebut || !nouveau.heureFin) throw new Error("Indiquez l'heure de début et l'heure de fin.");
        if (nouveau.heureFin <= nouveau.heureDebut) throw new Error("L'heure de fin doit être après l'heure de début.");
        const c = { jour: jourDe(nouveau.date), date: nouveau.date, heureDebut: nouveau.heureDebut, heureFin: nouveau.heureFin };
        if (creneaux.some((x) => memeCreneau(x, c))) throw new Error("Ce créneau est déjà dans la liste.");
        return { ...c, id: "d" + Date.now() };
    };

    const avecSaisie = () => (rempli ? [...creneaux, creneauSaisi()] : creneaux);

    const ajouterCreneau = () => {
        try {
            setCreneaux([...creneaux, creneauSaisi()]);
            setNouveau(VIDE);
            setErreur("");
        } catch (err) {
            setErreur(err.message);
        }
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

    const retirer = async () => {
        try {
            await retirerAnnonce(utilisateur);
            await recharger();
            setErreur("");
            setInfo("Votre annonce est retirée. Plus personne ne la voit. Vous pouvez la republier quand vous voulez.");
        } catch (err) {
            setErreur(err.message);
        }
    };

    const publier = async (e) => {
        e.preventDefault();
        try {
            const disponibilites = avecSaisie();
            await publierAnnonce(utilisateur, { services, disponibilites, description: description.trim() });
            await recharger();
            navigate(`/jeunes/${utilisateur.id}`);
        } catch (err) {
            setErreur(err.message);
        }
    };

    return (
        <Ecran titre="Mon annonce" retour="/accueil">
            <p className={utilisateur.annoncePubliee ? "etat-annonce en-ligne" : "etat-annonce"} role="status"><span aria-hidden="true" />{utilisateur.annoncePubliee ? "Votre annonce est en ligne" : "Votre annonce n'est pas en ligne"}</p>
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
                        <label>Date<select name="date" value={nouveau.date} onChange={changerNouveau("date")}><option value="">Choisir une date</option>{prochainsJours().map((d) => <option key={d} value={d}>{texteJour(d)}</option>)}</select></label>
                        <ChoixHeure libelle="Début" name="heureDebut" value={nouveau.heureDebut} onChange={changerNouveau("heureDebut")} />
                        <ChoixHeure libelle="Fin" name="heureFin" value={nouveau.heureFin} onChange={changerNouveau("heureFin")} />
                    </div>
                    <button type="button" className="secondary" onClick={ajouterCreneau}><Icone nom="plus" />Ajouter ce créneau</button>
                </fieldset>
                <label>Présentation courte ({description.length}/180)<textarea name="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Exemple : étudiant, disponible après les cours pour les courses et l'informatique." /></label>
                <div className="deux">
                    <button type="button" className="secondary" onClick={proposer}><Icone nom="sparkles" />{avantProposition !== null ? "Autre proposition" : "Proposer un texte"}</button>
                    {avantProposition !== null && <button type="button" className="secondary" onClick={refuser}>Garder mon texte</button>}
                </div>
                {avantProposition !== null && <p className="soft"><small>Proposition modifiable : relisez-la avant de publier.</small></p>}
                <Message erreur={erreur} info={info} />
                <button className="primary" type="submit"><span>{utilisateur.annoncePubliee ? "Mettre à jour mon annonce" : "Publier mon annonce"}</span><Icone nom="arrow" /></button>
            </form>
            {utilisateur.annoncePubliee && <button className="secondary bouton-retirer" type="button" onClick={retirer}><Icone nom="trash" />Retirer mon annonce</button>}
            <Indice icone="pin">L'adresse sert à calculer la distance avec les personnes du quartier. Elle n'est jamais affichée.</Indice>
        </Ecran>
    );
};

export default MonAnnonce;
