const { test, expect } = require("@playwright/test");
const { preparer, connecter, deconnecter } = require("./outils");

test.beforeEach(async ({ page }) => preparer(page));

test("US47 · Messagerie entre utilisateurs : un jeune écrit à un autre jeune, badge non lu, réponse et « Lu »", async ({ page }) => {
    await connecter(page, "lucas.martin@exemple.fr");
    await page.getByRole("link", { name: "Messages" }).click();
    await page.getByRole("link", { name: "Nouveau message" }).click();
    await page.getByPlaceholder("Rechercher un prénom").fill("ines");
    await page.getByRole("list", { name: "Jeunes volontaires du quartier" }).getByRole("link", { name: /Inès/ }).click();
    await expect(page.getByRole("heading", { name: "Inès" })).toBeVisible();
    await page.getByLabel("Votre message").fill("Salut Inès, on fait les courses de Madeleine ensemble samedi ?");
    await page.getByLabel("Votre message").press("Enter");
    await expect(page.locator(".message-bubble.mine")).toContainText("ensemble samedi");
    await expect(page.getByLabel("Votre message")).toHaveValue("");
    await deconnecter(page);

    await connecter(page, "ines.benali@exemple.fr");
    await expect(page.locator(".nav-badge")).toHaveText(/1/);
    await page.getByRole("link", { name: /Messages/ }).click();
    await expect(page.getByRole("link", { name: /Lucas/ })).toHaveClass(/non-lu/);
    await page.getByRole("link", { name: /Lucas/ }).click();
    await expect(page.locator(".message-bubble")).toContainText("ensemble samedi");
    await page.getByLabel("Votre message").fill("Avec plaisir !");
    await page.getByRole("button", { name: "Envoyer" }).click();
    await expect(page.locator(".message-bubble.mine")).toContainText("Avec plaisir");
    await page.goto("/accueil");
    await expect(page.locator(".nav-badge")).toHaveCount(0);
    await deconnecter(page);

    await connecter(page, "lucas.martin@exemple.fr");
    await page.goto("/messages/jeune-02");
    await expect(page.locator(".message-bubble.mine")).toContainText("Lu");
    await expect(page.locator(".message-bubble").last()).toContainText("Avec plaisir");
});

test("US47 · Temps réel : un message reçu s'affiche sans recharger la page", async ({ page }) => {
    await connecter(page, "lucas.martin@exemple.fr");
    await page.goto("/messages/jeune-02");
    await expect(page.getByText("Dites bonjour à Inès")).toBeVisible();
    await page.evaluate(() => {
        const db = JSON.parse(localStorage.getItem("vdo-db"));
        db.messages.direct1 = { de: "jeune-02", dePrenom: "Inès", a: "jeune-01", aPrenom: "Lucas", texte: "Coucou Lucas, je suis en route !", creeAt: new Date().toISOString() };
        localStorage.setItem("vdo-db", JSON.stringify(db));
        window.dispatchEvent(new CustomEvent("vdo-change", { detail: "messages" }));
    });
    await expect(page.locator(".message-bubble")).toContainText("je suis en route");
});

test("Messagerie : pas de liste des personnes âgées, seulement les jeunes et ses contacts", async ({ page }) => {
    await connecter(page, "lucas.martin@exemple.fr");
    await page.goto("/messages/nouveau");
    await expect(page.getByRole("list", { name: "Vos contacts" })).toContainText("Camille");
    const quartier = page.getByRole("list", { name: "Jeunes volontaires du quartier" });
    await expect(quartier.getByRole("listitem").first()).toBeVisible();
    await expect(quartier).not.toContainText("Personne âgée");
    await expect(quartier).not.toContainText("Proche accompagnateur");
});

test("US48 · Notification : un nouveau message affiche une alerte cliquable sur n'importe quel écran", async ({ page }) => {
    await connecter(page, "lucas.martin@exemple.fr");
    await page.goto("/recherche");
    await expect(page.getByText("jeunes disponibles").or(page.getByText("besoins près de vous"))).toBeVisible();
    await page.evaluate(() => {
        const db = JSON.parse(localStorage.getItem("vdo-db"));
        db.messages.notif1 = { de: "jeune-02", dePrenom: "Inès", a: "jeune-01", aPrenom: "Lucas", texte: "Tu as vu le besoin de Madeleine ?", creeAt: new Date().toISOString() };
        localStorage.setItem("vdo-db", JSON.stringify(db));
        window.dispatchEvent(new CustomEvent("vdo-change", { detail: "messages" }));
    });
    const alerte = page.getByRole("status").filter({ hasText: "Nouveau message de Inès" });
    await expect(alerte).toBeVisible();
    await expect(alerte).toContainText("Tu as vu le besoin de Madeleine");
    await expect(page).toHaveTitle(/^\(1\)/);
    await alerte.getByRole("link").click();
    await expect(page).toHaveURL(/messages\/jeune-02/);
    await expect(page.locator(".message-bubble")).toContainText("le besoin de Madeleine");
    await expect(alerte).toHaveCount(0);
});
