const path = require("path");
const donnees = require(path.join(__dirname, "../../specs/donnees.json"));

const ORDRE = ["DIMANCHE", "LUNDI", "MARDI", "MERCREDI", "JEUDI", "VENDREDI", "SAMEDI"];

const prochaineDateDu = (jour) => {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() + (((ORDRE.indexOf(jour) - d.getDay() + 7) % 7) || 7));
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const aJour = () => {
    const copie = JSON.parse(JSON.stringify(donnees));
    Object.values(copie.demandes).forEach((d) => {
        if (["ENVOYEE", "ACCEPTEE"].includes(d.statut) && d.creneau && d.creneau.jour) d.dateSouhaitee = prochaineDateDu(d.creneau.jour);
    });
    return copie;
};

const preparer = async (page) => {
    await page.addInitScript((db) => {
        if (!localStorage.getItem("vdo-db")) localStorage.setItem("vdo-db", JSON.stringify(db));
    }, aJour());
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

const JOURS_TEST = ["DIMANCHE", "LUNDI", "MARDI", "MERCREDI", "JEUDI", "VENDREDI", "SAMEDI"];

const choisirJour = async (page, jour) => {
    const champ = page.getByLabel("Disponibilité");
    const valeurs = await champ.locator("option").evaluateAll((options) => options.map((o) => o.value).filter(Boolean));
    const valeur = valeurs.find((v) => JOURS_TEST[new Date(`${v}T12:00:00`).getDay()] === jour);
    await champ.selectOption(valeur);
    return valeur;
};

module.exports = { donnees, preparer, connecter, deconnecter, remplirHeure, verifierHeure, choisirJour };
