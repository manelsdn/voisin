const admin = require("firebase-admin");
const donnees = require("./donnees.json");

admin.initializeApp({ credential: admin.credential.applicationDefault(), projectId: "granny-help-2561a" });
const db = admin.firestore();

const importer = async () => {
    for (const [collection, documents] of Object.entries(donnees)) {
        const lot = db.batch();
        for (const [id, data] of Object.entries(documents)) lot.set(db.collection(collection).doc(id), data);
        await lot.commit();
        console.log(`${collection} : ${Object.keys(documents).length} documents importés`);
    }
};

importer().then(() => process.exit(0)).catch((e) => {
    console.error(e.message);
    process.exit(1);
});
