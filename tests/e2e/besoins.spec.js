const { test, expect } = require("@playwright/test");
const { preparer, connecter, deconnecter } = require("./outils");

test.beforeEach(async ({ page }) => preparer(page));

test("US43 · Bouton central : un demandeur voit les jeunes en cartes, un jeune voit les besoins", async ({ page }) => {
    await connecter(page, "camille.moreau@exemple.fr");
    await page.getByRole("link", { name: "Trouver un jeune près de chez moi" }).click();
    await expect(page.getByRole("heading", { name: "Trouver un jeune" })).toBeVisible();
    await expect(page.locator(".carte-profil").first()).toBeVisible();
    await deconnecter(page);
    await connecter(page, "lucas.martin@exemple.fr");
    await page.getByRole("link", { name: "Aider : les besoins près de chez moi" }).click();
    await expect(page.getByRole("heading", { name: "Aider près de chez vous" })).toBeVisible();
    await expect(page.locator(".carte-besoin").first()).toBeVisible();
});

test("US44 · Publier un besoin : obligatoire de choisir un service et décrire, puis visible des jeunes", async ({ page }) => {
    await connecter(page, "camille.moreau@exemple.fr");
    await page.goto("/besoins/nouveau");
    await page.getByRole("button", { name: /Publier mon annonce/ }).click();
    await expect(page.getByRole("alert")).toContainText("Choisissez le service");
    await page.getByRole("button", { name: "Bricolage" }).click();
    await page.getByLabel(/Décrivez votre besoin/).fill("Monter un petit meuble de chevet chez Madeleine.");
    await page.getByLabel("Jour").selectOption("SAMEDI");
    await page.getByRole("button", { name: /Publier mon annonce/ }).click();
    await expect(page.getByRole("heading", { name: /Bricolage/ })).toBeVisible();
    await expect(page.getByText("Pas encore de proposition.")).toBeVisible();
    await deconnecter(page);
    await connecter(page, "lucas.martin@exemple.fr");
    await page.goto("/recherche");
    await page.getByRole("group", { name: "Filtrer par service" }).getByRole("button", { name: "Bricolage" }).click();
    await expect(page.getByText("Monter un petit meuble de chevet")).toBeVisible();
});

test("US45 · Proposer son aide : le demandeur voit la proposition et peut envoyer une demande", async ({ page }) => {
    await connecter(page, "lucas.martin@exemple.fr");
    await page.goto("/besoins/besoin-01");
    await expect(page.getByRole("heading", { name: /Jardinage/ })).toBeVisible();
    await page.getByLabel(/Un petit mot pour Camille/).fill("Bonjour Camille, j'adore jardiner, je suis libre samedi.");
    await page.getByRole("button", { name: /Proposer mon aide/ }).click();
    await expect(page.getByText("Vous avez proposé votre aide")).toBeVisible();
    await deconnecter(page);
    await connecter(page, "camille.moreau@exemple.fr");
    await page.goto("/besoins");
    await page.getByRole("link", { name: /Jardinage pour Madeleine/ }).click();
    await expect(page.getByText("j'adore jardiner")).toBeVisible();
    await page.getByRole("link", { name: "Lui envoyer une demande" }).click();
    await expect(page).toHaveURL(/jeunes\/jeune-01\/demande/);
    await expect(page.getByLabel("Quelques précisions")).toHaveValue(/rosiers/);
});

test("Photos : les profils sans photo ont un avatar illustré, pas une initiale", async ({ page }) => {
    await connecter(page, "camille.moreau@exemple.fr");
    await page.goto("/recherche");
    await page.getByLabel("Distance").selectOption("5");
    await expect(page.locator(".carte-profil").first()).toBeVisible();
    await expect(page.locator(".initial-avatar")).toHaveCount(0);
});

test("US46 · Dictée vocale : le senior parle, l'annonce s'écrit et le service et le créneau se remplissent", async ({ page }) => {
    await page.addInitScript(() => {
        window.SpeechRecognition = class {
            start() {
                setTimeout(() => {
                    const resultat = [{ transcript: "j'ai besoin de quelqu'un pour porter mes courses du marché samedi de 10h à 12h" }];
                    resultat.isFinal = true;
                    this.onresult({ resultIndex: 0, results: [resultat] });
                    this.onend();
                }, 50);
            }
            stop() { this.onend(); }
            abort() {}
        };
    });
    await connecter(page, "camille.moreau@exemple.fr");
    await page.goto("/besoins/nouveau");
    await page.getByRole("button", { name: /Dicter mon besoin/ }).click();
    await expect(page.getByLabel(/Décrivez votre besoin/)).toHaveValue(/^J'ai besoin de quelqu'un pour porter mes courses/);
    await expect(page.getByRole("button", { name: "Courses" })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByLabel("Jour")).toHaveValue("SAMEDI");
    await expect(page.getByLabel("Début")).toHaveValue("10:00");
    await expect(page.getByLabel("Fin")).toHaveValue("12:00");
    await expect(page.getByText(/Rempli d'après votre texte/)).toContainText("Courses · Samedi · 10:00-12:00");
    await page.getByRole("button", { name: "Bricolage" }).click();
    await page.getByLabel(/Décrivez votre besoin/).fill("Porter les courses");
    await expect(page.getByRole("button", { name: "Bricolage" })).toHaveAttribute("aria-pressed", "true");
    await page.getByRole("button", { name: /Publier mon annonce/ }).click();
    await expect(page.getByRole("heading", { name: /Bricolage/ })).toBeVisible();
});

test("Dictée absente si le navigateur ne la gère pas, la saisie au clavier remplit quand même le service", async ({ page }) => {
    await page.addInitScript(() => { delete window.SpeechRecognition; delete window.webkitSpeechRecognition; });
    await connecter(page, "camille.moreau@exemple.fr");
    await page.goto("/besoins/nouveau");
    await expect(page.getByRole("button", { name: /Dicter/ })).toHaveCount(0);
    await page.getByLabel(/Décrivez votre besoin/).fill("Aider ma mère à faire un appel vidéo sur sa tablette demain après-midi");
    await expect(page.getByRole("button", { name: "Informatique" })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByLabel("Début")).toHaveValue("14:00");
});
