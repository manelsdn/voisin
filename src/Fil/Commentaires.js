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

const Commentaires = ({ jeune, utilisateur, liste, maj }) => {
    const [texte, setTexte] = useState("");
    const [edition, setEdition] = useState(null);
    const [brouillon, setBrouillon] = useState("");
    const [erreur, setErreur] = useState("");

    const agir = async (action) => {
        try {
            await action();
            setErreur("");
            await maj();
        } catch (e) {
            setErreur(e.message);
        }
    };

    const publier = (e) => {
        e.preventDefault();
        agir(async () => {
            await commenter(utilisateur, jeune.id, texte);
            setTexte("");
        });
    };

    const enregistrer = (c) => agir(async () => {
        await modifierCommentaire(utilisateur, c, brouillon);
        setEdition(null);
    });

    return (
        <section className="commentaires" aria-label={`Commentaires sur ${jeune.prenom}`}>
            {liste.length === 0 && <p className="soft"><small>Pas encore de commentaire. Soyez le premier à dire un mot gentil !</small></p>}
            <ul>
                {liste.map((c) => {
                    const moi = c.auteurId === utilisateur.id;
                    return (
                        <li key={c.id} className="commentaire">
                            <Avatar personne={{ id: c.auteurId, prenom: c.auteurPrenom, photoProfil: c.auteurPhoto }} classe="commentaire-photo" />
                            <div className="commentaire-corps">
                                <p className="commentaire-tete"><strong>{moi ? "Vous" : c.auteurPrenom}</strong><small>{quand(c.creeAt)}{c.modifieAt ? " · modifié" : ""}</small></p>
                                {edition === c.id ? (
                                    <form className="commentaire-edition" onSubmit={(e) => { e.preventDefault(); enregistrer(c); }}>
                                        <label className="sr-only" htmlFor={`edit-${c.id}`}>Modifier mon commentaire</label>
                                        <textarea id={`edit-${c.id}`} value={brouillon} maxLength={300} onChange={(e) => setBrouillon(e.target.value)} />
                                        <div className="commentaire-boutons">
                                            <button type="submit" className="mini-bouton plein">Enregistrer</button>
                                            <button type="button" className="mini-bouton" onClick={() => setEdition(null)}>Annuler</button>
                                        </div>
                                    </form>
                                ) : <p className="commentaire-texte">{c.texte}</p>}
                                {moi && edition !== c.id && (
                                    <div className="commentaire-boutons">
                                        <button type="button" className="mini-bouton" onClick={() => { setEdition(c.id); setBrouillon(c.texte); }}><Icone nom="edit" />Modifier</button>
                                        <button type="button" className="mini-bouton" onClick={() => agir(() => supprimerCommentaire(utilisateur, c))}><Icone nom="trash" />Supprimer</button>
                                    </div>
                                )}
                            </div>
                        </li>
                    );
                })}
            </ul>
            <form className="commentaire-ajout" onSubmit={publier}>
                <label className="sr-only" htmlFor={`com-${jeune.id}`}>Votre commentaire sur {jeune.prenom}</label>
                <textarea id={`com-${jeune.id}`} value={texte} maxLength={300} rows={1} placeholder={`Un petit mot pour ${jeune.prenom}…`} onChange={(e) => setTexte(e.target.value)} />
                <button type="submit" className="mini-bouton plein" disabled={!texte.trim()}>Publier</button>
            </form>
            <Message erreur={erreur} />
        </section>
    );
};

export default Commentaires;
