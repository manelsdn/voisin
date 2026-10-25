const ENTETES = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Content-Type": "application/json; charset=utf-8"
};

const repondre = (corps, status = 200) => new Response(JSON.stringify(corps), { status, headers: ENTETES });

const geocoder = async (q) => {
    if (!q || q.trim().length < 3) return repondre({ erreur: "Adresse trop courte." }, 400);
    const r = await fetch(`https://api-adresse.data.gouv.fr/search/?limit=1&q=${encodeURIComponent(q)}`);
    if (!r.ok) return repondre({ erreur: "Service d'adresse indisponible." }, 502);
    const json = await r.json();
    const f = json.features && json.features[0];
    if (!f || f.properties.score < 0.4) return repondre({ erreur: "Adresse introuvable." }, 404);
    return repondre({
        latitude: f.geometry.coordinates[1],
        longitude: f.geometry.coordinates[0],
        ville: f.properties.city,
        codePostal: f.properties.postcode
    });
};

export default {
    async fetch(request) {
        if (request.method === "OPTIONS") return new Response(null, { headers: ENTETES });
        const url = new URL(request.url);
        if (request.method === "GET" && url.pathname === "/geocodage") return geocoder(url.searchParams.get("q"));
        return repondre({ erreur: "Route inconnue." }, 404);
    }
};
