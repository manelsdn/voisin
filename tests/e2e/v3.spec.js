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
    await expect(page.locator(".statut")).toHaveText("Confirmé");
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

test("Messagerie : émojis à côté du champ, fichier et vocal à droite", async ({ page }) => {
    await connecter(page, "camille.moreau@exemple.fr");
    await page.goto("/messages/jeune-01");
    await page.getByRole("button", { name: "Ajouter un émoji" }).click();
    await page.getByRole("button", { name: "Ajouter 😊" }).click();
    await expect(page.getByLabel("Votre message")).toHaveValue("😊");
    const champ = await page.getByLabel("Votre message").boundingBox();
    const trombone = await page.getByRole("button", { name: "Joindre une image ou un fichier" }).boundingBox();
    const micro = await page.getByRole("button", { name: /message vocal/ }).boundingBox();
    expect(trombone.x).toBeGreaterThan(champ.x);
    expect(micro.x).toBeGreaterThan(champ.x);
});

test("Fil : commenter une annonce, modifier puis supprimer son commentaire", async ({ page }) => {
    await connecter(page, "camille.moreau@exemple.fr");
    await page.goto("/fil");
    const post = page.locator("article.post").filter({ hasText: "Lucas" }).first();
    await post.getByRole("button", { name: /Commentaires \(2\)/ }).click();
    const zone = post.getByRole("region", { name: "Commentaires sur Lucas" });
    await expect(zone).toContainText("Ponctuel et serviable");
    await zone.getByLabel("Votre commentaire sur Lucas").fill("Super gentil, merci Lucas !");
    await zone.getByRole("button", { name: "Publier" }).click();
    await expect(zone).toContainText("Super gentil, merci Lucas !");
    await expect(post.getByRole("button", { name: /Commentaires \(3\)/ })).toBeVisible();
    await zone.getByRole("button", { name: "Modifier" }).click();
    await zone.getByLabel("Modifier mon commentaire").fill("Très gentil, merci Lucas !");
    await zone.getByRole("button", { name: "Enregistrer" }).click();
    await expect(zone).toContainText("Très gentil, merci Lucas !");
    await expect(zone).toContainText("modifié");
    await zone.getByRole("button", { name: "Supprimer" }).click();
    await expect(zone).not.toContainText("Très gentil, merci Lucas !");
    await expect(zone.getByRole("button", { name: "Modifier" })).toHaveCount(0);
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
