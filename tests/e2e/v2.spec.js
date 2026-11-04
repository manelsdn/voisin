const { test, expect } = require("@playwright/test");
const { preparer, connecter, deconnecter } = require("./outils");

test.beforeEach(async ({ page }) => preparer(page));

test("V2 · Carte : la recherche s'affiche aussi sur une carte", async ({ page }) => {
    await connecter(page, "camille.moreau@exemple.fr");
    await page.goto("/recherche");
    await page.getByRole("button", { name: "Carte" }).click();
    await expect(page.getByRole("region", { name: "Carte des jeunes disponibles" })).toBeVisible();
    await expect(page.locator(".pin-jeune").first()).toBeVisible();
    await expect(page.getByText("position approximative")).toBeVisible();
    await page.getByRole("button", { name: "Liste" }).click();
    await expect(page.locator(".resultat").first()).toBeVisible();
});

test("V2 · Fil du quartier : les annonces publiées s'affichent et se filtrent par service", async ({ page }) => {
    await connecter(page, "camille.moreau@exemple.fr");
    await page.getByRole("link", { name: /Le fil/ }).first().click();
    await expect(page.getByRole("heading", { name: /Le fil/ })).toBeVisible();
    await expect(page.locator(".post").first()).toBeVisible();
    await page.getByRole("list", { name: "Services" }).getByRole("link", { name: "Jardinage" }).click();
    await expect(page).toHaveURL(/service=JARDINAGE/);
    await expect(page.locator(".post-tag").first()).toHaveText("Jardinage");
    for (const t of await page.locator(".post-tag").allTextContents()) expect(t).toBe("Jardinage");
});

test("V2 · Messagerie : un message envoyé est visible des deux côtés", async ({ page }) => {
    await connecter(page, "camille.moreau@exemple.fr");
    await page.goto("/jeunes/jeune-01");
    await page.getByRole("link", { name: "Échanger avec Lucas" }).click();
    await page.getByRole("button", { name: /Envoyer/ }).click();
    await expect(page.getByRole("alert")).toContainText("Écrivez un message");
    await page.getByLabel("Votre message").fill("Bonjour Lucas, êtes-vous libre samedi ?");
    await page.getByRole("button", { name: /Envoyer/ }).click();
    await expect(page.locator(".message-bubble.mine")).toContainText("êtes-vous libre samedi");
    await deconnecter(page);
    await connecter(page, "lucas.martin@exemple.fr");
    await page.getByRole("link", { name: "Messages" }).click();
    await expect(page.getByRole("heading", { name: "Messages" })).toBeVisible();
    await page.getByRole("link", { name: /Camille/ }).click();
    await expect(page.locator(".message-bubble")).toContainText("êtes-vous libre samedi");
});

test("V2 · Charte d'entraide : accessible depuis le profil", async ({ page }) => {
    await connecter(page, "lucas.martin@exemple.fr");
    await page.goto("/profil");
    await page.getByRole("link", { name: "La charte d'entraide" }).click();
    await expect(page.getByRole("heading", { name: /Une entraide/ })).toBeVisible();
    await expect(page.getByText("Le pourboire est facultatif")).toBeVisible();
});

test("Fil homogène : seuls les jeunes avec une vraie photo apparaissent", async ({ page }) => {
    await connecter(page, "camille.moreau@exemple.fr");
    await page.goto("/fil");
    await expect(page.locator(".post").first()).toBeVisible();
    await expect(page.locator(".post .post-head span.carte-photo")).toHaveCount(0);
    expect(await page.locator(".post .post-head img.carte-photo").count()).toBe(await page.locator(".post").count());
});

test("US49 · J'aime : le compteur du fil augmente, le jeune voit qui aime son annonce", async ({ page }) => {
    await connecter(page, "camille.moreau@exemple.fr");
    await page.goto("/fil");
    const coeur = page.getByRole("button", { name: "Ajouter Lucas à mes favoris" });
    await expect(coeur).toContainText("4");
    await coeur.click();
    await expect(page.getByRole("button", { name: "Retirer Lucas de mes favoris" })).toContainText("5");
    await page.goto("/jeunes/jeune-01");
    await expect(page.getByText("5 voisins aiment son annonce")).toBeVisible();
    await deconnecter(page);
    await connecter(page, "lucas.martin@exemple.fr");
    await expect(page.getByRole("link", { name: /5 voisins aiment votre annonce/ })).toContainText("Camille");
});
