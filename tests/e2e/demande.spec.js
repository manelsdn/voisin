const { test, expect } = require("@playwright/test");
const { preparer, connecter, deconnecter, donnees } = require("./outils");

test.beforeEach(async ({ page }) => preparer(page));

const envoyer = async (page, precisions) => {
    await connecter(page, "camille.moreau@exemple.fr");
    await page.goto("/jeunes/jeune-01");
    await page.getByRole("link", { name: "Envoyer une demande" }).click();
    await expect(page.getByLabel("Pour")).toHaveValue("Madeleine");
    if (precisions) await page.getByLabel(/Un détail à préciser/).fill(precisions);
    await page.getByRole("button", { name: /Envoyer la demande/ }).click();
};

test("US17 · Demande : les précisions sont facultatives, une idée se touche pour remplir le champ", async ({ page }) => {
    await connecter(page, "camille.moreau@exemple.fr");
    await page.goto("/jeunes/jeune-01");
    await page.getByRole("link", { name: "Envoyer une demande" }).click();
    await page.getByRole("group", { name: "Idées de précisions" }).getByRole("button", { name: "Code et étage" }).click();
    await expect(page.getByLabel(/Un détail à préciser/)).toHaveValue("Code et étage");
    await page.getByLabel(/Un détail à préciser/).fill("");
    await page.getByRole("button", { name: /Envoyer la demande/ }).click();
    await expect(page.getByText("Votre demande est envoyée !")).toBeVisible();
    await deconnecter(page);
    await connecter(page, "lucas.martin@exemple.fr");
    await page.goto("/services");
    await page.getByRole("link", { name: /Courses · pour Madeleine/ }).first().click();
    await expect(page.getByText(/Pas de précision/)).toBeVisible();
});

test("US17 US22 US23 · Demande : envoyée, en attente et numéro masqué", async ({ page }) => {
    await envoyer(page, "Les courses au marché de la Guillotière.");
    await expect(page.getByText("Votre demande est envoyée !")).toBeVisible();
    await expect(page.locator(".statut")).toHaveText("En attente");
    await page.getByRole("link", { name: "Voir mes demandes" }).click();
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
    await expect(page.locator(".statut")).toHaveText("Acceptée");
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
    await expect(page.locator(".statut")).toHaveText("Refusée");
    await deconnecter(page);
    await connecter(page, "camille.moreau@exemple.fr");
    await page.goto("/demandes/demande-01");
    await expect(page.getByRole("link", { name: "Choisir un autre jeune" })).toBeVisible();
});

test("US18 · Annulation : le demandeur annule une demande en attente", async ({ page }) => {
    await connecter(page, "camille.moreau@exemple.fr");
    await page.goto("/demandes/demande-01");
    await page.getByRole("button", { name: "Annuler ma demande" }).click();
    await expect(page.locator(".statut")).toHaveText("Annulée");
    await expect(page.getByRole("button", { name: "Annuler ma demande" })).toHaveCount(0);
});

test("US14 · Accueil jeune : les demandes reçues en attente sont affichées en haut et peuvent être masquées", async ({ page }) => {
    await connecter(page, "lucas.martin@exemple.fr");
    const bandeau = page.locator(".bandeau-boite").filter({ hasText: "Madeleine vous demande de l'aide" });
    await expect(bandeau).toContainText("Courses");
    await bandeau.getByRole("button", { name: "Masquer ce message" }).click();
    await expect(page.getByText("Madeleine vous demande de l'aide")).toHaveCount(0);
});

test("US13 · Navigation : la barre du bas mène aux bons écrans", async ({ page }) => {
    await connecter(page, "camille.moreau@exemple.fr");
    await page.getByRole("link", { name: "Demandes" }).click();
    await expect(page).toHaveURL(/\/services$/);
    await page.getByRole("link", { name: "Messages" }).click();
    await expect(page.getByRole("heading", { name: "Messages" })).toBeVisible();
    await page.getByRole("link", { name: "Profil", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Mon profil" })).toBeVisible();
    await page.getByRole("link", { name: "Accueil" }).click();
    await expect(page.getByText("Bonjour Camille")).toBeVisible();
});
