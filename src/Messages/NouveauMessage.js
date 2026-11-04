import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useSession } from "../composants/Session";
import { Astuce, Avatar, Ecran, IconesServices } from "../composants/Mise";
import { Icone } from "../composants/Icones";
import { lireUtilisateur, membresDuQuartier, mesConversations, mesDemandes } from "../services/api";
import { ROLES, texteDistance } from "../services/constantes";

const normaliser = (t) => (t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

const Ligne = ({ personne }) => (
    <Link to={`/messages/${personne.id}`} className="carte-profil contact">
        <Avatar personne={personne} classe="carte-photo" />
        <span className="carte-corps">
            <span className="carte-ligne"><strong>{personne.prenom}</strong></span>
            <small>{[ROLES[personne.role], personne.distance != null ? texteDistance(personne.distance) : ""].filter(Boolean).join(" · ")}</small>
            {personne.services && personne.services.length > 0 && <IconesServices services={personne.services} max={4} />}
        </span>
        <Icone nom="message" />
    </Link>
);

const NouveauMessage = () => {
    const { utilisateur } = useSession();
    const [recherche, setRecherche] = useState("");
    const [contacts, setContacts] = useState(null);
    const [membres, setMembres] = useState(null);

    useEffect(() => {
        let actif = true;
        const charger = async () => {
            const [convs, demandes, quartier] = await Promise.all([
                mesConversations(utilisateur).catch(() => []),
                mesDemandes(utilisateur).catch(() => []),
                membresDuQuartier(utilisateur).catch(() => [])
            ]);
            const ids = [...new Set([...convs.map((c) => c.id), ...demandes.map((d) => (d.jeuneId === utilisateur.id ? d.demandeurId : d.jeuneId))])].filter((id) => id && id !== utilisateur.id);
            const profils = (await Promise.all(ids.map((id) => lireUtilisateur(id).catch(() => null)))).filter(Boolean);
            if (!actif) return;
            setContacts(profils);
            setMembres(quartier.filter((m) => !ids.includes(m.id)));
        };
        charger();
        return () => { actif = false; };
    }, [utilisateur]);

    const filtre = useMemo(() => {
        const q = normaliser(recherche.trim());
        return (liste) => (liste || []).filter((p) => !q || normaliser(p.prenom).includes(q));
    }, [recherche]);

    const vosContacts = filtre(contacts);
    const jeunes = filtre(membres);

    return (
        <Ecran titre="Nouveau message" retour="/messages">
            <label className="champ-recherche"><span className="sr-only">Rechercher un prénom</span><Icone nom="search" /><input type="search" placeholder="Rechercher un prénom" value={recherche} onChange={(e) => setRecherche(e.target.value)} /></label>
            {contacts === null && <div className="squelettes">{[0, 1, 2].map((i) => <span key={i} className="squelette" />)}</div>}
            {contacts && vosContacts.length > 0 && (
                <>
                    <h2 className="section-h">Vos contacts</h2>
                    <div className="liste-cartes" role="list" aria-label="Vos contacts">{vosContacts.map((p) => <div role="listitem" key={p.id}><Ligne personne={p} /></div>)}</div>
                </>
            )}
            {membres && (
                <>
                    <h2 className="section-h">Jeunes volontaires du quartier</h2>
                    {jeunes.length === 0 && <p className="soft">Personne ne correspond à « {recherche} ».</p>}
                    <div className="liste-cartes" role="list" aria-label="Jeunes volontaires du quartier">{jeunes.slice(0, 30).map((p) => <div role="listitem" key={p.id}><Ligne personne={p} /></div>)}</div>
                </>
            )}
            <Astuce icone="users">Pour protéger nos aînés, on écrit à une personne âgée ou à un proche seulement après son premier message ou depuis son annonce d'aide.</Astuce>
        </Ecran>
    );
};

export default NouveauMessage;
