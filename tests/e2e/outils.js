const path = require("path");
const donnees = require(path.join(__dirname, "../../specs/donnees.json"));

const preparer = async (page) => {
    await page.addInitScript((db) => {
        if (!localStorage.getItem("vdo-db")) localStorage.setItem("vdo-db", JSON.stringify(db));
    }, donnees);
};

const connecter = async (page, email) => {
    await page.goto("/connexion");
    await page.getByLabel("E-mail").fill(email);
    await page.getByRole("button", { name: /Recevoir le lien/ }).click();
    await page.getByRole("link", { name: "Ouvrir le lien reçu" }).click();
    await page.waitForURL("**/accueil");
};

const deconnecter = async (page) => {
    await page.goto("/profil");
    await page.getByRole("button", { name: "Se déconnecter" }).click();
    await page.waitForURL("**/bienvenue");
};

module.exports = { donnees, preparer, connecter, deconnecter };
