const CENTRES = {
    "69001": [45.7676, 4.8344], "69002": [45.7485, 4.8270], "69003": [45.7597, 4.8495],
    "69004": [45.7784, 4.8278], "69005": [45.7596, 4.8150], "69006": [45.7700, 4.8520],
    "69007": [45.7440, 4.8420], "69008": [45.7360, 4.8690], "69009": [45.7740, 4.8050],
    "69100": [45.7719, 4.8902], "69300" : [45.7969, 4.8423], "69400" : [45.9864, 4.7266],
    "69500": [45.7337, 4.9092], "69600": [45.7153, 4.8039], "69700" : [45.57413, 4.7382],
    "69800" : [44.7177,4.5468]
};

const VILLES = [
    "LYON", "VILLEURBANNE", "CALUIRE-ET-CUIRE", "VILLEFRANCHE-SUR-SAÔNE",
    "VENISSIEUX" , "SAINT-PRIEST", "BRON", "OULLINS", "ECHALAS"
];

export const distanceKm = (a, b) => {
    if (!a || !b || a.latitude == null || b.latitude == null) return null;
    const r = 6371;
    const rad = (x) => (x * Math.PI) / 180;
    const dLat = rad(b.latitude - a.latitude);
    const dLon = rad(b.longitude - a.longitude);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLon / 2) ** 2;
    return 2 * r * Math.asin(Math.sqrt(h));
};

// corrigé : petite fonction pour virer les accents et majuscules pour comparer les villes sans prise de tête
const normaliser = (chaine) =>
    String(chaine || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9]/g, "")
        .toUpperCase();

// corrigé : check souple pour choper les arrondissements et variantes (genre Lyon 3e ou Villefranche)
const estVilleCouverte = (nomVille) => {
    const villeNorm = normaliser(nomVille);
    if (!villeNorm) return false;
    return VILLES.some((v) => {
        const vNorm = normaliser(v);
        return villeNorm.includes(vNorm) || vNorm.includes(villeNorm);
    });
};

export const geocoder = async (arg1, arg2, arg3) => {
    let adresse, codePostal, ville;
    // corrigé : on accepte soit un objet direct soit 3 arguments séparés sinon ça passait undefined et ça plantait
    if (typeof arg1 === "object" && arg1 !== null) {
        ({ adresse, codePostal, ville } = arg1);
    } else {
        adresse = arg1;
        codePostal = arg2;
        ville = arg3;
    }

    adresse = String(adresse || "").trim();
    codePostal = String(codePostal || "").trim();
    ville = String(ville || "").trim();

    // corrigé : on check direct si un champ est vide pour pas envoyer de requêtes dans le vide
    if (!adresse || !codePostal || !ville) {
        const err = new Error("Tous les champs d'adresse (adresse, code postal, ville) sont obligatoires.");
        err.type = "geocodage";
        throw err;
    }

    // corrigé : on valide direct les 5 chiffres du code postal avant d'appeler l'API
    if (!/^\d{5}$/.test(codePostal)) {
        const err = new Error("Code postal invalide (doit comporter 5 chiffres).");
        err.type = "geocodage";
        throw err;
    }

    if (process.env.REACT_APP_MODE === "test") {
        const centre = CENTRES[String(codePostal).trim()];
        if (!centre) {
            const err = new Error(`Code postal ${codePostal} non reconnu en mode test.`);
            err.type = "geocodage";
            throw err;
        }
        return { latitude: centre[0], longitude: centre[1] };
    }

    const base = process.env.REACT_APP_WORKER_URL;
    if (base) {
        const url = `${base}/geocodage?q=${encodeURIComponent(`${adresse} ${codePostal} ${ville}`)}`;
        const reponse = await fetch(url);
        if (!reponse.ok) {
            const err = new Error("Erreur de géocodage");
            err.type = "geocodage";
            throw err;
        }
        return await reponse.json();
    }

    try {
        // corrigé : on cherche l'adresse complète avec BAN sans le check d'égalité stricte qui faisait tout foirer
        const urlAdresse = `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(`${adresse} ${codePostal} ${ville}`)}&postcode=${encodeURIComponent(codePostal)}&limit=1`;
        const repAdresse = await fetch(urlAdresse);
        const dataAdresse = repAdresse.ok ? await repAdresse.json() : null;
        const feature = dataAdresse && dataAdresse.features && dataAdresse.features[0];

        // corrigé : si BAN trouve un bon score on prend direct les coordonnées GPS
        if (feature && feature.properties.score >= 0.45) {
            const villeTrouvee = feature.properties.city || ville;
            // corrigé : si l'adresse est bonne mais hors zone couverte on le dit direct
            if (!estVilleCouverte(villeTrouvee) && !estVilleCouverte(ville)) {
                const err = new Error(`La ville « ${villeTrouvee} » n'est pas couverte par nos services. Villes acceptées : Lyon, Villeurbanne, Caluire-et-Cuire, Villefranche-sur-Saône, Vénissieux, Saint-Priest, Bron, Oullins, Échalas.`);
                err.type = "geocodage";
                throw err;
            }
            return {
                latitude: feature.geometry.coordinates[1],
                longitude: feature.geometry.coordinates[0]
            };
        }

        // Diagnostics détaillés si adresse non trouvée :
        // corrigé : check A - si le code postal existe même pas en France on prévient direct
        const urlCP = `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(codePostal)}&limit=1`;
        const repCP = await fetch(urlCP);
        const dataCP = repCP.ok ? await repCP.json() : null;
        if (!dataCP || !dataCP.features || dataCP.features.length === 0) {
            const err = new Error(`Code postal « ${codePostal} » inexistant en France.`);
            err.type = "geocodage";
            throw err;
        }

        // corrigé : check B - si la ville existe pas du tout en France on dit que c'est bidon
        const urlVille = `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(ville)}&type=municipality&limit=1`;
        const repVille = await fetch(urlVille);
        const dataVille = repVille.ok ? await repVille.json() : null;
        if (!dataVille || !dataVille.features || dataVille.features.length === 0) {
            const err = new Error(`Ville « ${ville} » inexistante.`);
            err.type = "geocodage";
            throw err;
        }

        // corrigé : check C - si la ville et le CP collent pas ensemble (genre Lyon avec 75001) on alerte
        const urlLien = `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(ville)}&postcode=${encodeURIComponent(codePostal)}&limit=1`;
        const repLien = await fetch(urlLien);
        const dataLien = repLien.ok ? await repLien.json() : null;
        if (!dataLien || !dataLien.features || dataLien.features.length === 0) {
            const err = new Error(`Le code postal ${codePostal} ne correspond pas à la ville « ${ville} » (ou inversement).`);
            err.type = "geocodage";
            throw err;
        }

        // corrigé : check D - la ville et le CP sont valides mais pas dans nos zones de service
        const communeTrouvee = dataLien.features[0].properties.city || ville;
        if (!estVilleCouverte(communeTrouvee) && !estVilleCouverte(ville)) {
            const err = new Error(`La ville « ${communeTrouvee} » n'est pas couverte par nos services. Villes acceptées : Lyon, Villeurbanne, Caluire-et-Cuire, Villefranche-sur-Saône, Vénissieux, Saint-Priest, Bron, Oullins, Échalas.`);
            err.type = "geocodage";
            throw err;
        }

        // corrigé : check E - ville et CP ok, donc c'est forcément la rue ou le numéro qui est introuvable
        const err = new Error(`Adresse « ${adresse} » introuvable à ${communeTrouvee} (${codePostal}). Vérifiez le numéro et le nom de la rue.`);
        err.type = "geocodage";
        throw err;
    } catch (e) {
        if (!e.type) e.type = "geocodage";
        throw e;
    }
};

export const prochaineDate = (jour, depuis = new Date()) => {
    const ordre = ["DIMANCHE", "LUNDI", "MARDI", "MERCREDI", "JEUDI", "VENDREDI", "SAMEDI"];
    const cible = ordre.indexOf(jour);
    const d = new Date(depuis);
    d.setHours(12, 0, 0, 0);
    let ecart = (cible - d.getDay() + 7) % 7;
    if (ecart === 0) ecart = 7;
    d.setDate(d.getDate() + ecart);
    return d.toISOString().slice(0, 10);
};

export const texteDate = (iso) => iso ? new Date(iso + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" }) : "";
