const { test, expect } = require("@playwright/test");
const { preparer, connecter, deconnecter, donnees } = require("./outils");

test.beforeEach(async ({ page }) => preparer(page));

const envoyer = async (page, precisions) => {
    await connecter(page, "camille.moreau@exemple.fr");
    await page.goto("/jeunes/jeune-01");
    await page.getByRole("link", { name: "Envoyer une demande" }).click();
    await expect(page.getByLabel("Pour")).toHaveValue("Madeleine");
    if (precisions) await page.getByLabel("Quelques précisions").fill(precisions);
    await page.getByRole("button", { name: /Envoyer la demande/ }).click();
};

test("US17 · Demande : impossible d'envoyer sans précisions", async ({ page }) => {
    await envoyer(page, "");
    await expect(page.getByRole("alert")).toContainText("quelques précisions");
});

test("US17 US22 US23 · Demande : envoyée, en attente et numéro masqué", async ({ page }) => {
    await envoyer(page, "Les courses au marché de la Guillotière.");
    await expect(page.getByText("Votre demande est envoyée !")).toBeVisible();
    await expect(page.getByText("Envoyée", { exact: true })).toBeVisible();
    await page.getByRole("link", { name: "Voir mes services" }).click();
    await page.getByRole("link", { name: /Courses · avec Lucas/ }).first().click();
    await expect(page.getByText("Visible après acceptation")).toBeVisible();
});

test("US19 US20 US22 · Réponse : le jeune accepte et les numéros deviennent visibles des deux côtés", async ({ page }) => {
    await envoyer(page, "Les courses au marché de la Guillotière.");
    await deconnecter(page);
    await connecter(page, "lucas.martin@exemple.fr");
    await page.goto("/services");
    await page.getByRole("link", { name: /Courses · pour Madeleine/ }).first().click();
    await expect(page.getByText("Visible après acceptation")).toBeVisible();
    await page.getByRole("button", { name: "Accepter la demande" }).click();
    await expect(page.getByText("Acceptée", { exact: true })).toBeVisible();
    await expect(page.locator(".numero")).toContainText(donnees.users["proche-01"].telephone);
    await deconnecter(page);
    await connecter(page, "camille.moreau@exemple.fr");
    await page.goto("/services");
    await page.getByRole("link", { name: /Courses · avec Lucas/ }).first().click();
    await expect(page.locator(".numero")).toContainText(donnees.users["jeune-01"].telephone);
});

test("US21 · Réponse : le jeune refuse et le demandeur peut choisir un autre jeune", async ({ page }) => {
    await connecter(page, "lucas.martin@exemple.fr");
    await page.goto("/demandes/demande-01");
    await page.getByRole("button", { name: "Refuser" }).click();
    await expect(page.getByText("Refusée", { exact: true })).toBeVisible();
    await deconnecter(page);
    await connecter(page, "camille.moreau@exemple.fr");
    await page.goto("/demandes/demande-01");
    await expect(page.getByRole("link", { name: "Choisir un autre jeune" })).toBeVisible();
});

test("US18 · Annulation : le demandeur annule une demande en attente", async ({ page }) => {
    await connecter(page, "camille.moreau@exemple.fr");
    await page.goto("/demandes/demande-01");
    await page.getByRole("button", { name: "Annuler ma demande" }).click();
    await expect(page.getByText("Annulée", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Annuler ma demande" })).toHaveCount(0);
});

test("US14 · Accueil jeune : les demandes reçues en attente sont affichées", async ({ page }) => {
    await connecter(page, "lucas.martin@exemple.fr");
    await expect(page.getByText("Demandes reçues")).toBeVisible();
    await expect(page.getByRole("link", { name: /Madeleine · Courses/ })).toBeVisible();
});

test("US13 · Navigation : la barre du bas mène aux bons écrans", async ({ page }) => {
    await connecter(page, "camille.moreau@exemple.fr");
    await page.getByRole("link", { name: "Services" }).click();
    await expect(page).toHaveURL(/\/services$/);
    await page.getByRole("link", { name: "Messages" }).click();
    await expect(page.getByRole("heading", { name: "On garde le lien." })).toBeVisible();
    await page.getByRole("link", { name: "Profil", exact: true }).click();
    await expect(page.getByRole("heading", { name: /Votre place/ })).toBeVisible();
    await page.getByRole("link", { name: "Accueil" }).click();
    await expect(page.getByText("Bonjour Camille")).toBeVisible();
});
