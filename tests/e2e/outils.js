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

const remplirHeure = async (page, libelle, valeur) => {
    const [h, m] = valeur.split(":");
    await page.getByLabel(`${libelle} : heure`).selectOption(h);
    await page.getByLabel(`${libelle} : minutes`).selectOption(m);
};

const verifierHeure = async (page, libelle, valeur) => {
    const { expect } = require("@playwright/test");
    const [h, m] = valeur ? valeur.split(":") : ["", "00"];
    await expect(page.getByLabel(`${libelle} : heure`)).toHaveValue(h);
    await expect(page.getByLabel(`${libelle} : minutes`)).toHaveValue(m);
};

module.exports = { donnees, preparer, connecter, deconnecter, remplirHeure, verifierHeure };
