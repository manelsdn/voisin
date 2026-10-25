const { test, expect } = require("@playwright/test");
const { preparer, connecter, deconnecter } = require("./outils");

test.beforeEach(async ({ page }) => preparer(page));

test("US08 · Annonce : au moins un service est obligatoire", async ({ page }) => {
    await connecter(page, "lucas.martin@exemple.fr");
    await page.goto("/annonce");
    await page.getByRole("button", { name: "Courses" }).click();
    await page.getByRole("button", { name: "Informatique" }).click();
    await page.getByRole("button", { name: "Publier mon annonce" }).click();
    await expect(page.getByRole("alert")).toContainText("au moins un service");
});

test("US09 · Créneaux : l'heure de fin doit être après l'heure de début", async ({ page }) => {
    await connecter(page, "lucas.martin@exemple.fr");
    await page.goto("/annonce");
    await page.getByLabel("Début").fill("15:00");
    await page.getByLabel("Fin").fill("14:00");
    await page.getByRole("button", { name: "Ajouter ce créneau" }).click();
    await expect(page.getByRole("alert")).toContainText("après l'heure de début");
});

test("US08 US09 US10 · Annonce : un nouveau jeune publie et apparaît dans la recherche", async ({ page }) => {
    await page.goto("/inscription");
    await page.getByRole("button", { name: /Je donne un coup de main/ }).click();
    await page.getByRole("button", { name: /Continuer/ }).click();
    for (const [l, v] of Object.entries({ "Prénom": "Zinedine", "Nom": "Roux", "E-mail": "zinedine.roux@exemple.fr", "Téléphone": "06 99 88 77 66", "Adresse": "5 rue Moncey", "Code postal": "69003", "Ville": "Lyon" })) await page.getByLabel(l, { exact: true }).fill(v);
    await page.getByRole("button", { name: /Recevoir le lien/ }).click();
    await page.getByRole("link", { name: "Ouvrir le lien reçu" }).click();
    await page.waitForURL("**/accueil");
    await page.getByRole("link", { name: "Publier mon annonce" }).click();
    await page.getByRole("button", { name: "Jardinage" }).click();
    await page.getByRole("button", { name: "Publier mon annonce" }).click();
    await expect(page.getByRole("alert")).toContainText("au moins un créneau");
    await page.getByLabel("Jour").selectOption("DIMANCHE");
    await page.getByRole("button", { name: "Ajouter ce créneau" }).click();
    await page.getByLabel(/Présentation courte/).fill("Je m'occupe des plantes du quartier.");
    await page.getByRole("button", { name: "Publier mon annonce" }).click();
    await expect(page.getByText("APERÇU DE MON ANNONCE")).toBeVisible();
    await expect(page.getByText("Dimanche 09:00-12:00")).toBeVisible();
    await deconnecter(page);
    await connecter(page, "camille.moreau@exemple.fr");
    await page.goto("/recherche");
    await page.getByLabel("Service").selectOption("JARDINAGE");
    await page.getByLabel("Disponibilité").selectOption("DIMANCHE");
    await expect(page.getByRole("link", { name: /Zinedine/ })).toBeVisible();
});
