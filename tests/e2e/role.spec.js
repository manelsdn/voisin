const { test, expect } = require("@playwright/test");
const { preparer, connecter } = require("./outils");

test.beforeEach(async ({ page }) => preparer(page));

test("US42 · Changer de rôle : bloqué si un service est en cours", async ({ page }) => {
    await connecter(page, "lucas.martin@exemple.fr");
    await page.goto("/profil");
    await page.getByRole("link", { name: "Changer de rôle" }).click();
    await page.getByRole("button", { name: /Je cherche de l'aide/ }).click();
    await page.getByRole("button", { name: /Confirmer mon nouveau rôle/ }).click();
    await expect(page.getByRole("alert")).toContainText("service en cours");
});

test("US42 · Changer de rôle : un jeune devient personne âgée et son annonce est retirée", async ({ page }) => {
    await connecter(page, "theo.boyer@exemple.fr");
    await page.goto("/profil");
    await page.getByRole("link", { name: "Changer de rôle" }).click();
    await page.getByRole("button", { name: /Je cherche de l'aide/ }).click();
    await expect(page.getByText("Votre annonce sera retirée")).toBeVisible();
    await page.getByRole("button", { name: /Confirmer mon nouveau rôle/ }).click();
    await page.waitForURL("**/accueil");
    await expect(page.locator(".role-badge")).toHaveText("Personne âgée");
    await page.goto("/fil");
    await expect(page.locator(".post-head strong", { hasText: "Théo" })).toHaveCount(0);
});
