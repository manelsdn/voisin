import { useState } from "react";
import { Avatar, Message } from "../composants/Mise";
import { Icone } from "../composants/Icones";
import { commenter, modifierCommentaire, supprimerCommentaire } from "../services/api";

const quand = (iso) => {
    const d = new Date(iso);
    const jours = Math.floor((Date.now() - d.getTime()) / 86400000);
    if (jours < 1) return "aujourd'hui";
    if (jours === 1) return "hier";
    if (jours < 7) return `il y a ${jours} jours`;
    return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
};

export const Etoiles = ({ note }) => <span className="etoiles" role="img" aria-label={`${note} sur 5`}>{"★".repeat(note)}{"☆".repeat(5 - note)}</span>;

const ChoixNote = ({ note, choisir }) => (
    <div className="etoiles-choix" role="radiogroup" aria-label="Note">
        {[1, 2, 3, 4, 5].map((n) => <button key={n} type="button" role="radio" aria-checked={note === n} aria-label={`${n} sur 5`} className={n <= note ? "on" : ""} onClick={() => choisir(n)}>★</button>)}
    </div>
);

const FormAvis = ({ jeune, depart, envoyer, annuler }) => {
    const [note, setNote] = useState(depart ? depart.note || 0 : 0);
    const [texte, setTexte] = useState(depart ? depart.texte || "" : "");
    return (
        <form className="avis-form" onSubmit={(e) => { e.preventDefault(); envoyer(note, texte); }}>
            <p className="avis-form-titre">{depart ? "Modifier mon avis" : `Votre avis sur ${jeune.prenom}`}</p>
            <ChoixNote note={note} choisir={setNote} />
            <label className="sr-only" htmlFor={`avis-${jeune.id}`}>Votre avis en quelques mots</label>
            <textarea id={`avis-${jeune.id}`} value={texte} maxLength={300} rows={2} placeholder={`Un mot pour ${jeune.prenom} (facultatif)`} onChange={(e) => setTexte(e.target.value)} />
            <div className="commentaire-boutons">
                <button type="submit" className="mini-bouton plein" disabled={!note}>{depart ? "Enregistrer" : "Publier mon avis"}</button>
                {annuler && <button type="button" className="mini-bouton" onClick={annuler}>Annuler</button>}
            </div>
        </form>
    );
};

const Commentaires = ({ jeune, utilisateur, liste, maj, notent = "VOISINS" }) => {
    const [edition, setEdition] = useState(false);
    const [erreur, setErreur] = useState("");
    const mien = liste.find((c) => c.auteurId === utilisateur.id);
    const peutNoter = (notent === "JEUNES") === (utilisateur.role === "JEUNE") && utilisateur.id !== jeune.id;

    const agir = async (action) => {
        try {
            await action();
            setErreur("");
            setEdition(false);
            await maj();
        } catch (e) {
            setErreur(e.message);
        }
    };

    return (
        <section className="avis-fil" aria-label={`Avis sur ${jeune.prenom}`}>
            {liste.length === 0 && <p className="soft"><small>Pas encore d'avis sur {jeune.prenom}.</small></p>}
            <ul>
                {liste.map((c) => {
                    const moi = c.auteurId === utilisateur.id;
                    if (moi && edition) return <li key={c.id}><FormAvis jeune={jeune} depart={c} envoyer={(n, t) => agir(() => modifierCommentaire(utilisateur, c, n, t))} annuler={() => setEdition(false)} /></li>;
                    return (
                        <li key={c.id} className="avis-carte">
                            <Avatar personne={{ id: c.auteurId, prenom: c.auteurPrenom, photoProfil: c.auteurPhoto }} classe="commentaire-photo" />
                            <div className="avis-corps">
                                <p className="avis-tete"><strong>{moi ? "Votre avis" : c.auteurPrenom}</strong><small>{quand(c.creeAt)}{c.modifieAt ? " · modifié" : ""}</small></p>
                                <Etoiles note={c.note || 5} />
                                {c.texte && <p className="avis-texte">{c.texte}</p>}
                                {moi && (
                                    <div className="commentaire-boutons">
                                        <button type="button" className="mini-bouton" onClick={() => setEdition(true)}><Icone nom="edit" />Modifier</button>
                                        <button type="button" className="mini-bouton" onClick={() => agir(() => supprimerCommentaire(utilisateur, c))}><Icone nom="trash" />Supprimer</button>
                                    </div>
                                )}
                            </div>
                        </li>
                    );
                })}
            </ul>
            {peutNoter && !mien && <FormAvis jeune={jeune} envoyer={(n, t) => agir(() => commenter(utilisateur, jeune.id, n, t))} />}
            <Message erreur={erreur} />
        </section>
    );
};

export default Commentaires;
