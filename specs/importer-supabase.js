const { createClient } = require("@supabase/supabase-js");
const donnees = require("./donnees.json");

const TABLES = { users: "users", demandes: "demandes", rendezVous: "rendez_vous", messages: "messages" };
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const importer = async () => {
    for (const [collection, documents] of Object.entries(donnees)) {
        const lignes = Object.entries(documents).map(([id, data]) => ({ id, data }));
        const { error } = await supabase.from(TABLES[collection]).upsert(lignes);
        if (error) throw new Error(error.message);
        console.log(`${collection} : ${lignes.length} documents importés`);
    }
};

importer().then(() => process.exit(0)).catch((e) => {
    console.error(e.message);
    process.exit(1);
});
