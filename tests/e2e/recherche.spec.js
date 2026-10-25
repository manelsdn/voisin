const { test, expect } = require("@playwright/test");
const { preparer, connecter } = require("./outils");

test.beforeEach(async ({ page }) => preparer(page));

const distances = async (page) => {
    const textes = await page.locator(".resultat small").allTextContents();
    return textes.map((t) => {
        const v = t.split(" · ")[0];
        return v.endsWith(" km") ? parseFloat(v.replace(",", ".")) : parseInt(v, 10) / 1000;
    });
};

test("US15 · Recherche : les résultats sont triés du plus proche au plus éloigné", async ({ page }) => {
    await connecter(page, "camille.moreau@exemple.fr");
    await page.goto("/recherche");
    await page.getByLabel("Distance").selectOption("5");
    await expect(page.locator(".resultat").first()).toBeVisible();
    const d = await distances(page);
    expect(d.length).toBeGreaterThan(5);
    expect([...d].sort((a, b) => a - b)).toEqual(d);
    expect(Math.max(...d)).toBeLessThanOrEqual(5);
});

test("US15 · Recherche : le filtre service ne garde que les jeunes qui le proposent", async ({ page }) => {
    await connecter(page, "camille.moreau@exemple.fr");
    await page.goto("/recherche");
    await page.getByLabel("Distance").selectOption("5");
    await page.getByLabel("Service").selectOption("COURSES");
    await expect(page.locator(".resultat").first()).toBeVisible();
    for (const t of await page.locator(".resultat small").allTextContents()) expect(t).toContain("Courses");
});

test("US15 · Recherche : un message s'affiche quand il n'y a aucun résultat", async ({ page }) => {
    await page.goto("/inscription");
    await page.getByRole("button", { name: /Je cherche de l'aide/ }).click();
    await page.getByRole("button", { name: /Continuer/ }).click();
    for (const [l, v] of Object.entries({ "Prénom": "Gisèle", "Nom": "Morel", "E-mail": "gisele.morel@exemple.fr", "Téléphone": "04 78 00 11 22", "Adresse": "2 rue Anatole France", "Code postal": "69100", "Ville": "Villeurbanne" })) await page.getByLabel(l, { exact: true }).fill(v);
    await page.getByRole("button", { name: /Recevoir le lien/ }).click();
    await page.getByRole("link", { name: "Ouvrir le lien reçu" }).click();
    await page.waitForURL("**/accueil");
    await page.goto("/recherche");
    await page.getByLabel("Distance").selectOption("0.5");
    await expect(page.getByText("Personne pour ces critères")).toBeVisible();
});

test("US15 · Recherche : les filtres restent choisis quand on revient", async ({ page }) => {
    await connecter(page, "camille.moreau@exemple.fr");
    await page.goto("/recherche");
    await page.getByLabel("Service").selectOption("INFORMATIQUE");
    await page.goto("/accueil");
    await page.goto("/recherche");
    await expect(page.getByLabel("Service")).toHaveValue("INFORMATIQUE");
});

test("US16 · Profil d'un jeune : services, distance et créneaux visibles, sans téléphone", async ({ page }) => {
    await connecter(page, "camille.moreau@exemple.fr");
    await page.goto("/jeunes/jeune-01");
    await expect(page.getByRole("heading", { name: /Lucas/ })).toBeVisible();
    await expect(page.getByText("Courses · Informatique")).toBeVisible();
    await expect(page.getByText("Samedi 09:00-12:00")).toBeVisible();
    await expect(page.getByText(/À .* · Lyon/)).toBeVisible();
    await expect(page.locator("body")).not.toContainText("06 ");
});
