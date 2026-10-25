const { test, expect } = require("@playwright/test");
const { preparer, connecter, deconnecter } = require("./outils");

test.beforeEach(async ({ page }) => preparer(page));

const remplir = async (page, champs) => {
    for (const [label, valeur] of Object.entries(champs)) await page.getByLabel(label, { exact: true }).fill(valeur);
};

test("US04 · Choix du rôle : le rôle est obligatoire", async ({ page }) => {
    await page.goto("/inscription");
    await page.getByRole("button", { name: /Continuer/ }).click();
    await expect(page.getByRole("alert")).toContainText("Choisissez votre rôle");
});

test("US01 · Inscription : tous les champs sont obligatoires", async ({ page }) => {
    await page.goto("/inscription");
    await page.getByRole("button", { name: /Je donne un coup de main/ }).click();
    await page.getByRole("button", { name: /Continuer/ }).click();
    await remplir(page, { "Prénom": "Léo" });
    await page.getByRole("button", { name: /Recevoir le lien/ }).click();
    await expect(page.getByRole("alert")).toContainText("Tous les champs sont obligatoires");
});

test("US01 · Inscription : un e-mail déjà utilisé est refusé", async ({ page }) => {
    await page.goto("/inscription");
    await page.getByRole("button", { name: /Je donne un coup de main/ }).click();
    await page.getByRole("button", { name: /Continuer/ }).click();
    await remplir(page, { "Prénom": "Léo", "Nom": "Blanc", "E-mail": "lucas.martin@exemple.fr", "Téléphone": "06 11 22 33 44", "Adresse": "3 rue Paul Bert", "Code postal": "69003", "Ville": "Lyon" });
    await page.getByLabel(/J'accepte la/).check();
    await page.getByRole("button", { name: /Recevoir le lien/ }).click();
    await expect(page.getByRole("alert")).toContainText("Un compte existe déjà");
});

test("US06 · Mon adresse : une adresse introuvable affiche un message", async ({ page }) => {
    await page.goto("/inscription");
    await page.getByRole("button", { name: /Je donne un coup de main/ }).click();
    await page.getByRole("button", { name: /Continuer/ }).click();
    await remplir(page, { "Prénom": "Léo", "Nom": "Blanc", "E-mail": "leo.blanc@exemple.fr", "Téléphone": "06 11 22 33 44", "Adresse": "nulle part", "Code postal": "99999", "Ville": "Inconnue" });
    await page.getByLabel(/J'accepte la/).check();
    await page.getByRole("button", { name: /Recevoir le lien/ }).click();
    await expect(page.getByRole("alert")).toContainText("Adresse introuvable");
});

test("US01 US11 · Inscription jeune : le compte est créé et l'accueil affiche le rôle et la ville", async ({ page }) => {
    await page.goto("/inscription");
    await page.getByRole("button", { name: /Je donne un coup de main/ }).click();
    await page.getByRole("button", { name: /Continuer/ }).click();
    await remplir(page, { "Prénom": "Léo", "Nom": "Blanc", "E-mail": "leo.blanc@exemple.fr", "Téléphone": "06 11 22 33 44", "Adresse": "3 rue Paul Bert", "Code postal": "69003", "Ville": "Lyon" });
    await page.getByLabel(/J'accepte la/).check();
    await page.getByRole("button", { name: /Recevoir le lien/ }).click();
    await expect(page.getByText("Vérifiez votre e-mail.")).toBeVisible();
    await page.getByRole("link", { name: "Ouvrir le lien reçu" }).click();
    await page.waitForURL("**/accueil");
    await expect(page.getByText("Bonjour Léo")).toBeVisible();
    await expect(page.getByText("Jeune volontaire")).toBeVisible();
    await expect(page.locator(".location-button")).toContainText("Lyon");
});

test("US05 US12 · Proche : l'accord est obligatoire puis le bloc « Pour Madeleine » s'affiche", async ({ page }) => {
    await page.goto("/inscription");
    await page.getByRole("button", { name: /J'accompagne un proche/ }).click();
    await page.getByRole("button", { name: /Continuer/ }).click();
    await remplir(page, { "Prénom": "Claire", "Nom": "Petit", "E-mail": "claire.petit@exemple.fr", "Téléphone": "06 55 44 33 22", "Votre adresse": "10 cours Vitton", "Code postal": "69006", "Ville": "Lyon" });
    await page.getByLabel(/J'accepte la/).check();
    await page.getByRole("button", { name: /Recevoir le lien/ }).click();
    await page.getByRole("link", { name: "Ouvrir le lien reçu" }).click();
    await page.waitForURL("**/proche");
    await remplir(page, { "Prénom de votre proche": "Madeleine", "Son adresse": "8 rue Moncey", "Code postal": "69003", "Ville": "Lyon" });
    await page.getByRole("button", { name: "Enregistrer" }).click();
    await expect(page.getByRole("alert")).toContainText("d'accord");
    await page.getByLabel(/Mon proche est d'accord/).check();
    await page.getByRole("button", { name: "Enregistrer" }).click();
    await page.waitForURL("**/accueil");
    await expect(page.getByText("Pour Madeleine")).toBeVisible();
});

test("US02 · Connexion : un e-mail sans compte affiche un message", async ({ page }) => {
    await page.goto("/connexion");
    await page.getByLabel("E-mail").fill("personne@exemple.fr");
    await page.getByRole("button", { name: /Recevoir le lien/ }).click();
    await expect(page.getByRole("alert")).toContainText("Aucun compte");
});

test("US02 US03 · Connexion par lien puis déconnexion", async ({ page }) => {
    await connecter(page, "camille.moreau@exemple.fr");
    await expect(page.getByText("Bonjour Camille")).toBeVisible();
    await expect(page.getByText("Proche accompagnateur")).toBeVisible();
    await deconnecter(page);
    await page.goto("/accueil");
    await page.waitForURL("**/connexion");
});

test("US07 · Modifier mon profil : un e-mail déjà utilisé est refusé", async ({ page }) => {
    await connecter(page, "camille.moreau@exemple.fr");
    await page.goto("/modifier-profil");
    await page.getByLabel("E-mail").fill("lucas.martin@exemple.fr");
    await page.getByRole("button", { name: "Enregistrer" }).click();
    await expect(page.getByRole("alert")).toContainText("déjà utilisée");
});

test("US07 · Modifier mon profil : le changement est visible tout de suite", async ({ page }) => {
    await connecter(page, "camille.moreau@exemple.fr");
    await page.goto("/modifier-profil");
    await page.getByLabel("Téléphone").fill("07 01 02 03 04");
    await page.getByRole("button", { name: "Enregistrer" }).click();
    await page.waitForURL("**/profil");
    await expect(page.getByText("07 01 02 03 04")).toBeVisible();
});
