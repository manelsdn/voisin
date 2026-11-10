import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSession } from "../composants/Session";
import { Ecran, Indice, Message } from "../composants/Mise";
import { Icone } from "../composants/Icones";
import Dictee, { enPhrase } from "../composants/Dictee";
import { analyser, servicesDans } from "../services/dictee";
import { publierAnnonce, retirerAnnonce, suggestionAnnonce } from "../services/api";
import { JOURS, NOMS_JOURS, SERVICES, aujourdhuiIso, creneauxActifs, nomService, texteCreneau, texteJour } from "../services/constantes";

const MOMENTS = [["Matin", "09:00", "12:00"], ["Après-midi", "14:00", "17:00"], ["Soir", "18:00", "20:00"]];
const COURTS = { LUNDI: "Lun", MARDI: "Mar", MERCREDI: "Mer", JEUDI: "Jeu", VENDREDI: "Ven", SAMEDI: "Sam", DIMANCHE: "Dim" };

const prochainsJours = () => {
    const d = new Date(`${aujourdhuiIso()}T12:00:00`);
    return Array.from({ length: 28 }, (_, i) => {
        const x = new Date(d);
        x.setDate(x.getDate() + i);
        return aujourdhuiIso(x);
    });
};

const jourDe = (iso) => JOURS[(new Date(`${iso}T12:00:00`).getDay() + 6) % 7];

const memeCreneau = (a, b) => a.jour === b.jour && (a.date || "") === (b.date || "") && a.heureDebut === b.heureDebut && a.heureFin === b.heureFin;

const MonAnnonce = () => {
    const { utilisateur, recharger } = useSession();
    const [services, setServices] = useState(utilisateur.services || []);
    const [creneaux, setCreneaux] = useState(creneauxActifs(utilisateur.disponibilites));
    const [description, setDescription] = useState(utilisateur.description || "");
    const [nouveau, setNouveau] = useState({ jour: "SAMEDI", date: "", heureDebut: "09:00", heureFin: "12:00" });
    const [unique, setUnique] = useState(false);
    const [brouillon, setBrouillon] = useState(!(utilisateur.disponibilites || []).length);
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
        if (trouve.jour) {
            setNouveau((n) => ({ jour: trouve.jour, date: n.date && unique ? trouve.date || "" : "", heureDebut: trouve.heureDebut || n.heureDebut, heureFin: trouve.heureFin || n.heureFin }));
            setBrouillon(true);
        }
        setCompris(detectes.length || trouve.jour ? { services: detectes, creneau: trouve.jour ? `${NOMS_JOURS[trouve.jour]}${trouve.heureDebut ? ` ${trouve.heureDebut}-${trouve.heureFin}` : ""}` : "" } : null);
    };

    const basculer = (code) => setServices(services.includes(code) ? services.filter((c) => c !== code) : [...services, code]);

    const changerNouveau = (champ) => (e) => {
        const valeur = e.target.value;
        setNouveau(champ === "date" ? { ...nouveau, date: valeur, jour: jourDe(valeur) } : { ...nouveau, [champ]: valeur });
        setBrouillon(true);
    };

    const changerRepetition = (e) => {
        const seule = e.target.value === "UNE";
        setUnique(seule);
        const premiere = prochainsJours().find((d) => jourDe(d) === nouveau.jour) || aujourdhuiIso();
        setNouveau(seule ? { ...nouveau, date: premiere, jour: jourDe(premiere) } : { ...nouveau, date: "" });
        setBrouillon(true);
    };

    const dejaLa = (c) => creneaux.some((x) => memeCreneau(x, c));

    const basculerMoment = (jour, [, debut, fin]) => {
        const c = { jour, date: "", heureDebut: debut, heureFin: fin };
        setCreneaux(dejaLa(c) ? creneaux.filter((x) => !memeCreneau(x, c)) : [...creneaux, { ...c, id: "d" + Date.now() + jour + debut }]);
        if (brouillon && memeCreneau(nouveau, c)) setBrouillon(false);
        setErreur("");
    };

    const avecBrouillon = () => {
        if (!brouillon || dejaLa(nouveau)) return creneaux;
        if (nouveau.heureFin <= nouveau.heureDebut) throw new Error("L'heure de fin doit être après l'heure de début.");
        if (nouveau.date && nouveau.date < aujourdhuiIso()) throw new Error("Cette date est déjà passée.");
        const { date, ...reste } = nouveau;
        return [...creneaux, { ...(date ? { ...reste, date } : reste), id: "d" + Date.now() }];
    };

    const ajouterCreneau = () => {
        try {
            setCreneaux(avecBrouillon());
            setBrouillon(false);
            setErreur("");
        } catch (err) {
            setErreur(err.message);
        }
    };

    const proposer = () => {
        try {
            const mots = avantProposition !== null ? avantProposition : description;
            setDescription(suggestionAnnonce({ prenom: utilisateur.prenom, mots, services, disponibilites: brouillon && !dejaLa(nouveau) ? [...creneaux, nouveau] : creneaux }, essai));
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
            const disponibilites = avecBrouillon();
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
                    <p className="soft"><small>Touchez les cases pour vos disponibilités de chaque semaine.</small></p>
                    <div className="semaine-type" role="group" aria-label="Semaine type">
                        <span aria-hidden="true" />
                        {JOURS.map((j) => <span key={j} className="semaine-jour" aria-hidden="true">{COURTS[j]}</span>)}
                        {MOMENTS.map((m) => (
                            <div key={m[0]} className="semaine-ligne">
                                <span className="semaine-moment">{m[0]}</span>
                                {JOURS.map((j) => {
                                    const actif = dejaLa({ jour: j, date: "", heureDebut: m[1], heureFin: m[2] });
                                    return <button key={j} type="button" className="semaine-case" aria-pressed={actif} aria-label={`${NOMS_JOURS[j]} ${m[0].toLowerCase()} (${m[1]}-${m[2]})`} onClick={() => basculerMoment(j, m)}>{actif ? "✓" : ""}</button>;
                                })}
                            </div>
                        ))}
                    </div>
                    {creneaux.length === 0 && !brouillon && <p className="soft">Aucun créneau pour le moment.</p>}
                    <ul className="creneaux">
                        {creneaux.map((c) => (
                            <li key={c.id}><span>{texteCreneau(c)}<small>{c.date ? "Une seule fois" : "Chaque semaine"}</small></span> <button type="button" onClick={() => setCreneaux(creneaux.filter((x) => x.id !== c.id))}>Retirer</button></li>
                        ))}
                        {brouillon && !dejaLa(nouveau) && (
                            <li className="creneau-auto"><span>{texteCreneau(nouveau)}<small>Ajouté automatiquement</small></span><button type="button" onClick={() => setBrouillon(false)}>Retirer</button></li>
                        )}
                    </ul>
                    <p className="creneau-perso-titre">Un autre horaire ou une date précise :</p>
                    <label>Répétition<select name="repetition" value={unique ? "UNE" : "SEMAINE"} onChange={changerRepetition}><option value="SEMAINE">Chaque semaine</option><option value="UNE">Une seule fois (date précise)</option></select></label>
                    <div className="trois">
                        {unique
                            ? <label>Date<select name="date" value={nouveau.date} onChange={changerNouveau("date")}>{prochainsJours().map((d) => <option key={d} value={d}>{texteJour(d)}</option>)}</select></label>
                            : <label>Jour<select name="jour" value={nouveau.jour} onChange={changerNouveau("jour")}>{JOURS.map((j) => <option key={j} value={j}>{NOMS_JOURS[j]}</option>)}</select></label>}
                        <label>Début<input name="heureDebut" type="time" value={nouveau.heureDebut} onChange={changerNouveau("heureDebut")} /></label>
                        <label>Fin<input name="heureFin" type="time" value={nouveau.heureFin} onChange={changerNouveau("heureFin")} /></label>
                    </div>
                    <button type="button" className="secondary" onClick={ajouterCreneau}>Ajouter un autre créneau</button>
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
