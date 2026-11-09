import { useEffect, useState } from "react";
import { Icone } from "./Icones";

const chercherAdresses = async (texte) => {
    const url = `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(texte)}&autocomplete=1&limit=5&lat=45.76&lon=4.84`;
    const reponse = await fetch(url);
    if (!reponse.ok) return [];
    const { features = [] } = await reponse.json();
    return features
        .filter((f) => f.properties.postcode && f.properties.city)
        .map((f) => ({ adresse: f.properties.name, codePostal: f.properties.postcode, ville: f.properties.city, cle: f.properties.id || f.properties.label }));
};

const ChampAdresse = ({ libelle = "Adresse", initial = {}, exemple = "12 rue Paul Bert" }) => {
    const [adresse, setAdresse] = useState(initial.adresse || "");
    const [codePostal, setCodePostal] = useState(initial.codePostal || "");
    const [ville, setVille] = useState(initial.ville || "");
    const [propositions, setPropositions] = useState([]);
    const [tape, setTape] = useState(false);

    useEffect(() => {
        if (!tape || adresse.trim().length < 4) {
            setPropositions([]);
            return undefined;
        }
        let actif = true;
        const minuteur = setTimeout(() => {
            chercherAdresses(adresse.trim())
                .then((liste) => actif && setPropositions(liste))
                .catch(() => actif && setPropositions([]));
        }, 250);
        return () => {
            actif = false;
            clearTimeout(minuteur);
        };
    }, [adresse, tape]);

    const choisir = (p) => {
        setAdresse(p.adresse);
        setCodePostal(p.codePostal);
        setVille(p.ville);
        setTape(false);
        setPropositions([]);
    };

    return (
        <>
            <div className="champ-adresse">
                <label>{libelle}<input name="adresse" autoComplete="off" value={adresse} placeholder={exemple} role="combobox" aria-autocomplete="list" aria-expanded={propositions.length > 0} aria-controls="adresses-proposees" onChange={(e) => { setAdresse(e.target.value); setTape(true); }} onBlur={() => setTimeout(() => setPropositions([]), 200)} /></label>
                {propositions.length > 0 && (
                    <ul className="adresses-proposees" id="adresses-proposees" role="listbox" aria-label="Adresses proposées">
                        {propositions.map((p) => (
                            <li key={p.cle} role="option" aria-selected="false">
                                <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => choisir(p)}><Icone nom="pin" /><span><strong>{p.adresse}</strong><small>{p.codePostal} {p.ville}</small></span></button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            <div className="deux">
                <label>Code postal<input name="codePostal" autoComplete="postal-code" inputMode="numeric" value={codePostal} placeholder="69003" onChange={(e) => setCodePostal(e.target.value)} /></label>
                <label>Ville<input name="ville" autoComplete="address-level2" value={ville} placeholder="Lyon" onChange={(e) => setVille(e.target.value)} /></label>
            </div>
        </>
    );
};

export default ChampAdresse;
