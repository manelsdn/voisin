const { test, expect } = require("@playwright/test");
const { preparer, connecter, deconnecter, donnees } = require("./outils");

test.beforeEach(async ({ page }) => preparer(page));

test("Profil du proche accompagnateur : ses nom, adresse et ceux de la personne accompagnée", async ({ page }) => {
    const camille = donnees.users["proche-01"];
    const madeleine = donnees.users["senior-01"];
    await connecter(page, "camille.moreau@exemple.fr");
    await page.goto("/profil");
    await expect(page.getByRole("region", { name: "Mes informations" })).toContainText(`${camille.prenom} ${camille.nom}`);
    await expect(page.getByRole("region", { name: "Mes informations" })).toContainText(camille.adresse);
    const proche = page.getByRole("region", { name: "La personne que j'accompagne" });
    await expect(proche).toContainText(madeleine.prenom);
    await expect(proche).toContainText(madeleine.adresse);
    await proche.getByRole("link", { name: /Modifier son nom ou son adresse/ }).click();
    await page.getByLabel("Nom", { exact: true }).fill("Dupuis");
    await page.getByRole("button", { name: "Enregistrer les modifications" }).click();
    await page.goto("/profil");
    await expect(proche).toContainText("Dupuis");
});

test("Numéro sur le profil : visible pendant un service accepté, masqué sinon", async ({ page }) => {
    await connecter(page, "camille.moreau@exemple.fr");
    await page.goto("/jeunes/jeune-02");
    await expect(page.locator(".numero")).toContainText(donnees.users["jeune-02"].telephone);
    await page.goto("/jeunes/jeune-03");
    await expect(page.locator(".numero")).toContainText("Masqué");
    await expect(page.locator(".numero")).not.toContainText(donnees.users["jeune-03"].telephone);
});

test("Notifications : le jeune est prévenu d'une demande, le demandeur de l'acceptation", async ({ page }) => {
    await connecter(page, "camille.moreau@exemple.fr");
    await page.goto("/jeunes/jeune-01");
    await page.getByRole("link", { name: "Envoyer une demande" }).click();
    await page.getByLabel("Quelques précisions").fill("Les courses au marché.");
    await page.getByRole("button", { name: /Envoyer la demande/ }).click();
    await expect(page.getByText("Votre demande est envoyée !")).toBeVisible();
    await deconnecter(page);
    await connecter(page, "lucas.martin@exemple.fr");
    await page.goto("/messages/proche-01");
    await expect(page.getByText(/Nouvelle demande/).last()).toBeVisible();
    await page.getByRole("link", { name: "Voir la demande" }).last().click();
    await page.getByRole("button", { name: "Accepter la demande" }).click();
    await expect(page.locator(".statut")).toHaveText("Acceptée");
    await deconnecter(page);
    await connecter(page, "camille.moreau@exemple.fr");
    await page.goto("/messages/jeune-01");
    await expect(page.getByText(/Lucas a accepté votre demande/)).toBeVisible();
});

test("Notifications : une alerte apparaît quand une demande arrive", async ({ page }) => {
    await connecter(page, "lucas.martin@exemple.fr");
    await page.goto("/profil");
    await expect(page.getByRole("heading", { name: "Mon profil" })).toBeVisible();
    await page.evaluate(() => {
        const db = JSON.parse(localStorage.getItem("vdo-db"));
        db.messages.ev1 = { de: "proche-01", dePrenom: "Camille", a: "jeune-01", aPrenom: "Lucas", texte: "📩 Nouvelle demande de Camille", evenement: { type: "DEMANDE_RECUE", demandeId: "demande-01" }, creeAt: new Date().toISOString() };
        localStorage.setItem("vdo-db", JSON.stringify(db));
        window.dispatchEvent(new CustomEvent("vdo-change", { detail: "messages" }));
    });
    const alerte = page.getByRole("status").filter({ hasText: "Nouvelle demande de Camille" });
    await expect(alerte).toBeVisible();
    await alerte.getByRole("link").click();
    await expect(page).toHaveURL(/demandes\/demande-01/);
});

test("Mes services : étapes claires et demande à traiter mise en avant", async ({ page }) => {
    await connecter(page, "lucas.martin@exemple.fr");
    await page.goto("/services");
    await expect(page.getByText("1 demande attend votre réponse.")).toBeVisible();
    await expect(page.locator(".statut.a-faire").first()).toHaveText("À vous de répondre");
    await page.locator(".carte-suivi.a-faire").first().click();
    await expect(page.getByText("Et maintenant ?")).toBeVisible();
    await expect(page.getByRole("list", { name: "Avancement" })).toBeVisible();
});

test("Messagerie : vocal à gauche, émojis et fichier dans le champ", async ({ page }) => {
    await connecter(page, "camille.moreau@exemple.fr");
    await page.goto("/messages/jeune-01");
    await page.getByRole("button", { name: "Ajouter un émoji" }).click();
    await page.getByRole("button", { name: "Ajouter 😊" }).click();
    await expect(page.getByLabel("Votre message")).toHaveValue("😊");
    const champ = await page.getByLabel("Votre message").boundingBox();
    const trombone = await page.getByRole("button", { name: "Joindre une image ou un fichier" }).boundingBox();
    const micro = await page.getByRole("button", { name: /message vocal/ }).boundingBox();
    expect(trombone.x).toBeGreaterThan(champ.x);
    expect(micro.x).toBeLessThan(champ.x);
});

test("Session : on reste connecté après avoir rechargé la page", async ({ page }) => {
    await connecter(page, "camille.moreau@exemple.fr");
    await page.reload();
    await expect(page).toHaveURL(/accueil/);
    await page.goto("/profil");
    await expect(page.getByRole("heading", { name: "Mon profil" })).toBeVisible();
});

test("Compte : suppression avec confirmation", async ({ page }) => {
    await connecter(page, "axel.boyer@exemple.fr");
    await page.goto("/profil");
    await page.getByRole("button", { name: "Supprimer mon compte" }).click();
    await page.getByRole("button", { name: "Non, garder mon compte" }).click();
    await expect(page.getByRole("heading", { name: "Mon profil" })).toBeVisible();
    await page.getByRole("button", { name: "Supprimer mon compte" }).click();
    await expect(page.getByText("Ce n'est pas réversible.")).toBeVisible();
    await page.getByRole("button", { name: "Oui, supprimer définitivement" }).click();
    await expect(page).toHaveURL(/bienvenue/);
    const reste = await page.evaluate(() => Object.values(JSON.parse(localStorage.getItem("vdo-db")).users).some((u) => u.email === "axel.boyer@exemple.fr"));
    expect(reste).toBe(false);
});

test("Annonce : le jeune peut retirer son annonce puis la republier", async ({ page }) => {
    await connecter(page, "lucas.martin@exemple.fr");
    await page.goto("/annonce");
    await expect(page.getByText("Votre annonce est en ligne")).toBeVisible();
    await page.getByRole("button", { name: "Retirer mon annonce" }).click();
    await expect(page.getByText("Votre annonce n'est pas en ligne")).toBeVisible();
    await deconnecter(page);
    await connecter(page, "camille.moreau@exemple.fr");
    await page.goto("/recherche");
    await expect(page.locator(".resultat").filter({ hasText: "Lucas" })).toHaveCount(0);
    await deconnecter(page);
    await connecter(page, "lucas.martin@exemple.fr");
    await page.goto("/annonce");
    await page.getByRole("button", { name: /Publier mon annonce/ }).click();
    await expect(page).toHaveURL(/jeunes\/jeune-01/);
});

test("Fil des voisins : le jeune voit les personnes qui ont besoin d'aide et peut proposer son aide", async ({ page }) => {
    await connecter(page, "lucas.martin@exemple.fr");
    await page.goto("/fil");
    await expect(page.getByRole("heading", { name: /Le fil des voisins/ })).toBeVisible();
    const post = page.locator("article.post").filter({ hasText: "Madeleine" }).first();
    await expect(post.getByRole("button", { name: /Avis/ })).toHaveCount(0);
    await post.getByRole("link", { name: /Proposer mon aide/ }).click();
    await expect(page).toHaveURL(/besoins\//);
});

test("Chat : on ouvre le profil de la personne en touchant son nom", async ({ page }) => {
    await connecter(page, "lucas.martin@exemple.fr");
    await page.goto("/messages/proche-01");
    await page.getByRole("link", { name: "Voir le profil de Camille" }).click();
    await expect(page).toHaveURL(/voisins\/proche-01/);
    await expect(page.getByRole("heading", { name: "Camille" })).toBeVisible();
    await expect(page.getByText("Accompagne Madeleine")).toBeVisible();
    await deconnecter(page);
    await connecter(page, "camille.moreau@exemple.fr");
    await page.goto("/messages/jeune-01");
    await page.getByRole("link", { name: "Voir le profil de Lucas" }).click();
    await expect(page).toHaveURL(/jeunes\/jeune-01/);
});

test("Distance : 2 km au maximum", async ({ page }) => {
    await connecter(page, "lucas.martin@exemple.fr");
    await page.goto("/recherche");
    await expect(page.getByLabel("Distance").locator("option")).toHaveCount(3);
    await expect(page.getByLabel("Distance")).toHaveValue("2");
});

test("Accueil jeune : le message « voisins aiment votre annonce » peut être masqué", async ({ page }) => {
    await connecter(page, "lucas.martin@exemple.fr");
    await expect(page.getByText(/voisins aiment votre annonce/)).toBeVisible();
    await page.getByRole("button", { name: "Masquer ce message" }).click();
    await expect(page.getByText(/voisins aiment votre annonce/)).toHaveCount(0);
    await page.reload();
    await expect(page.getByRole("heading", { name: "Ce que vous pouvez proposer" })).toBeVisible();
    await expect(page.getByText(/voisins aiment votre annonce/)).toHaveCount(0);
});
