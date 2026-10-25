const path = require("path");
const { test, expect } = require("@playwright/test");
const { preparer, connecter, deconnecter } = require("./outils");

test.use({ permissions: ["microphone"], launchOptions: { args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"] } });

test.beforeEach(async ({ page }) => preparer(page));

test("US29 · Charte : l'acceptation est obligatoire à l'inscription", async ({ page }) => {
    await page.goto("/inscription");
    await page.getByRole("button", { name: /Je donne un coup de main/ }).click();
    await page.getByRole("button", { name: /Continuer/ }).click();
    for (const [l, v] of Object.entries({ "Prénom": "Léo", "Nom": "Blanc", "E-mail": "leo.blanc@exemple.fr", "Téléphone": "06 11 22 33 44", "Adresse": "3 rue Paul Bert", "Code postal": "69003", "Ville": "Lyon" })) await page.getByLabel(l, { exact: true }).fill(v);
    await page.getByRole("button", { name: /Recevoir le lien/ }).click();
    await expect(page.getByRole("alert")).toContainText("Acceptez la charte");
    await page.getByLabel(/J'accepte la/).check();
    await page.getByRole("button", { name: /Recevoir le lien/ }).click();
    await expect(page.getByText("Vérifiez votre e-mail.")).toBeVisible();
});

test("US33 US34 US35 US36 · Service terminé, historique, avis puis redemander", async ({ page }) => {
    await connecter(page, "ines.benali@exemple.fr");
    await page.goto("/demandes/demande-13");
    await expect(page.getByLabel("Infos locales")).toBeVisible();
    await page.getByRole("button", { name: /Service terminé/ }).click();
    await expect(page.locator(".statut.TERMINEE")).toHaveText("Terminée");
    await expect(page.getByRole("button", { name: /Service terminé/ })).toHaveCount(0);
    await deconnecter(page);

    await connecter(page, "camille.moreau@exemple.fr");
    await page.goto("/services");
    await page.getByRole("tab", { name: "À venir" }).click();
    await expect(page.locator(".statut.TERMINEE")).toHaveCount(0);
    await page.getByRole("tab", { name: "Passés" }).click();
    await page.getByRole("link", { name: /Ménage · avec Inès/ }).click();
    await page.getByRole("radio", { name: "4 sur 5" }).click();
    await page.getByLabel(/Un petit mot/).fill("Très gentille et efficace, merci !");
    await page.getByRole("button", { name: /Publier mon avis/ }).click();
    await expect(page.getByText("VOTRE AVIS")).toBeVisible();
    await expect(page.getByRole("button", { name: /Publier mon avis/ })).toHaveCount(0);

    await page.getByRole("link", { name: /Redemander à Inès/ }).click();
    await expect(page).toHaveURL(/jeunes\/jeune-02\/demande\?service=MENAGE/);
    await expect(page.getByLabel("Service")).toHaveValue("MENAGE");

    await page.goto("/jeunes/jeune-02");
    await expect(page.getByText("1 avis")).toBeVisible();
    await expect(page.getByText("Très gentille et efficace")).toBeVisible();
});

test("US37 · Favoris : gardés après déconnexion, un deuxième clic les retire", async ({ page }) => {
    await connecter(page, "camille.moreau@exemple.fr");
    await page.goto("/jeunes/jeune-01");
    await page.getByRole("button", { name: "Ajouter aux favoris" }).click();
    await expect(page.getByRole("button", { name: "Dans mes favoris" })).toBeVisible();
    await deconnecter(page);
    await connecter(page, "camille.moreau@exemple.fr");
    await page.goto("/profil");
    await expect(page.getByLabel("Mes favoris").getByText("Lucas")).toBeVisible();
    await page.goto("/fil");
    await page.getByRole("button", { name: "Retirer Lucas de mes favoris" }).click();
    await expect(page.getByRole("button", { name: "Ajouter Lucas à mes favoris" })).toBeVisible();
    await page.goto("/profil");
    await expect(page.getByLabel("Mes favoris").getByText("Lucas")).toHaveCount(0);
});

test("US38 · Photo dans une demande : visible par le jeune", async ({ page }) => {
    await connecter(page, "camille.moreau@exemple.fr");
    await page.goto("/jeunes/jeune-01/demande");
    await page.getByLabel(/Joindre une photo du besoin/).setInputFiles(path.join(__dirname, "../../public/assets/logo-voisin-dor-icone.svg"));
    await expect(page.getByAltText("Aperçu du besoin à montrer")).toBeVisible();
    await page.getByLabel("Quelques précisions").fill("La poignée de la porte est cassée.");
    await page.getByRole("button", { name: /Envoyer la demande/ }).click();
    await page.waitForURL("**/demande-envoyee/**");
    const id = page.url().split("/").pop();
    await deconnecter(page);
    await connecter(page, "lucas.martin@exemple.fr");
    await page.goto(`/demandes/${id}`);
    await expect(page.getByAltText("Le besoin montré par le demandeur")).toBeVisible();
});

test("US39 · Message vocal : envoyé puis écoutable par l'autre personne", async ({ page }) => {
    await connecter(page, "camille.moreau@exemple.fr");
    await page.goto("/messages/jeune-01");
    const micro = page.getByRole("button", { name: /Maintenir pour un message vocal/ });
    await micro.hover();
    await page.mouse.down();
    await expect(page.getByRole("button", { name: /Relâchez pour envoyer/ })).toBeVisible();
    await page.waitForTimeout(1600);
    await page.mouse.up();
    await expect(page.locator(".message-bubble.mine audio")).toHaveCount(1);
    await deconnecter(page);
    await connecter(page, "lucas.martin@exemple.fr");
    await page.goto("/messages");
    await expect(page.getByText("Message vocal")).toBeVisible();
    await page.goto("/messages/proche-01");
    await expect(page.locator(".message-bubble audio")).toHaveCount(1);
});

test("US40 · Annonce assistée : texte proposé de 180 caractères maximum, modifiable ou refusé", async ({ page }) => {
    await connecter(page, "lucas.martin@exemple.fr");
    await page.goto("/annonce");
    const champ = page.getByLabel(/Présentation courte/);
    await champ.fill("étudiant en L2");
    await page.getByRole("button", { name: "Proposer un texte" }).click();
    const propose = await champ.inputValue();
    expect(propose.length).toBeLessThanOrEqual(180);
    expect(propose).toContain("Lucas");
    expect(propose).toContain("étudiant en L2");
    await page.getByRole("button", { name: "Autre proposition" }).click();
    expect(await champ.inputValue()).not.toBe(propose);
    await page.getByRole("button", { name: "Garder mon texte" }).click();
    await expect(champ).toHaveValue("étudiant en L2");
});
