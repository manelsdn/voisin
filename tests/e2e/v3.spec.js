const { test, expect } = require("@playwright/test");
const { preparer, connecter, deconnecter, donnees, remplirHeure, verifierHeure, choisirJour } = require("./outils");

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
    await page.getByLabel(/Un mot pour/).fill("Les courses au marché.");
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
    await page.getByRole("button", { name: /Publier mon (annonce|besoin)/ }).click();
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
    await page.locator(".bandeau-likes-boite").getByRole("button", { name: "Masquer ce message" }).click();
    await expect(page.getByText(/voisins aiment votre annonce/)).toHaveCount(0);
    await page.reload();
    await expect(page.getByRole("heading", { name: "Ce que vous pouvez proposer" })).toBeVisible();
    await expect(page.getByText(/voisins aiment votre annonce/)).toHaveCount(0);
});

test("Rappel : la veille du rendez-vous, un bandeau le rappelle au demandeur et au jeune", async ({ page }) => {
    await page.addInitScript(() => {
        if (sessionStorage.getItem("rappel-pret")) return;
        const db = JSON.parse(localStorage.getItem("vdo-db"));
        const d = new Date();
        d.setDate(d.getDate() + 1);
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        db.demandes["demande-13"].dateSouhaitee = d.toISOString().slice(0, 10);
        localStorage.setItem("vdo-db", JSON.stringify(db));
        sessionStorage.setItem("rappel-pret", "1");
    });
    await connecter(page, "camille.moreau@exemple.fr");
    await expect(page.locator(".bandeau-rappel")).toContainText(/^Demain \d+h/);
    await expect(page.locator(".bandeau-rappel")).toContainText("avec Inès");
    await deconnecter(page);
    await connecter(page, "ines.benali@exemple.fr");
    await expect(page.locator(".bandeau-rappel")).toContainText("chez Madeleine");
    await page.locator(".bandeau-boite").filter({ has: page.locator(".bandeau-rappel") }).getByRole("button", { name: "Masquer ce message" }).click();
    await expect(page.locator(".bandeau-rappel")).toHaveCount(0);
    await page.reload();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator(".bandeau-rappel")).toHaveCount(0);
});

test("Recherche sans assistant : personne ne correspond, on peut quand même prévenir les jeunes", async ({ page }) => {
    await connecter(page, "camille.moreau@exemple.fr");
    await page.goto("/recherche");
    await page.getByRole("group", { name: "Filtrer par service" }).getByRole("button", { name: "Cuisine" }).click();
    await page.getByLabel("Distance").selectOption("0.5");
    await choisirJour(page, "DIMANCHE");
    await expect(page.getByText("Personne pour ces critères pour le moment.")).toBeVisible();
    await page.getByRole("button", { name: "Prévenir les jeunes du quartier" }).click();
    await expect(page.getByRole("heading", { name: /Cuisine/ })).toBeVisible();
    await expect(page.getByText(/Je cherche un jeune pour cuisine le dimanche \d+ \S+\./)).toBeVisible();
});

test("Carte : recherche précise avec la barre au-dessus de la carte", async ({ page }) => {
    await connecter(page, "camille.moreau@exemple.fr");
    await page.goto("/recherche");
    await page.getByRole("button", { name: "Carte" }).click();
    await page.getByRole("searchbox", { name: "Rechercher sur la carte" }).fill("un jeune pour du bricolage samedi matin");
    await page.keyboard.press("Enter");
    await expect(page.getByText("J'ai compris")).toContainText("Bricolage");
    await expect(page.locator('select[name="date"]').locator("option:checked")).toHaveText(/^(Sam\.|Aujourd'hui|Demain)/);
    await expect(page.getByRole("region", { name: "Carte des jeunes disponibles" })).toBeVisible();
});

test("Catégories : nouvelles catégories, sous-catégorie et vraie date dans la demande", async ({ page }) => {
    await connecter(page, "camille.moreau@exemple.fr");
    await page.goto("/besoins/nouveau");
    for (const nom of ["Compagnie", "Sorties", "Papiers", "Animaux"]) await expect(page.getByRole("button", { name: nom, exact: true })).toBeVisible();
    await page.getByLabel(/Le texte de l'annonce/).fill("Accompagner chez le médecin samedi prochain à 10h");
    await expect(page.getByRole("button", { name: "Sorties", exact: true })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("group", { name: "Précision du besoin" }).getByRole("button", { name: "Rendez-vous médical" })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByLabel("Date").locator("option:checked")).toHaveText(/^Samedi \d+/);
    await page.getByRole("button", { name: /Publier mon (annonce|besoin)/ }).click();
    await expect(page.getByRole("heading", { name: /Sorties · Rendez-vous médical/ })).toBeVisible();
    await expect(page.getByText(/Samedi \d+ \S+, 10h-12h/)).toBeVisible();
    await page.goto("/jeunes/jeune-01");
    await page.getByRole("link", { name: "Envoyer une demande" }).click();
    await page.getByRole("group", { name: "Précision du besoin" }).getByRole("button", { name: "Pharmacie" }).click();
    const date = page.locator('select[name="date"]');
    await expect(date.locator("option")).toHaveCount(4);
    await date.selectOption({ index: 1 });
    const choisie = (await date.locator("option:checked").textContent()).trim();
    await page.getByRole("button", { name: /Envoyer la demande/ }).click();
    await expect(page.getByText("Votre demande est envoyée !")).toBeVisible();
    await expect(page.getByRole("heading", { name: /Courses · Pharmacie avec/ })).toBeVisible();
    await expect(page.getByText(choisie, { exact: false })).toBeVisible();
});

test("Annonce jeune : on ajoute plusieurs dates, le formulaire se vide après chaque ajout", async ({ page }) => {
    await connecter(page, "lucas.martin@exemple.fr");
    await page.goto("/annonce");
    const date = page.locator('select[name="date"]');
    await expect(date).toHaveValue("");
    await verifierHeure(page, "Début", "");
    const textes = [];
    for (const [index, debut, fin] of [[2, "10:00", "11:30"], [5, "14:00", "16:00"]]) {
        await date.selectOption({ index });
        textes.push((await date.locator("option:checked").textContent()).trim());
        await remplirHeure(page, "Début", debut);
        await remplirHeure(page, "Fin", fin);
        await page.getByRole("button", { name: "Ajouter ce créneau" }).click();
        await expect(date).toHaveValue("");
        await verifierHeure(page, "Début", "");
    }
    await expect(page.locator(".creneaux")).toContainText(`${textes[0]}, 10h-11h30`);
    await expect(page.locator(".creneaux")).toContainText(`${textes[1]}, 14h-16h`);
    await page.getByRole("button", { name: /Publier mon annonce|Mettre à jour mon annonce/ }).click();
    await expect(page.getByText(`${textes[0]}, 10h-11h30`)).toBeVisible();
    await expect(page.getByText(`${textes[1]}, 14h-16h`)).toBeVisible();
});

test("Filtres : distance en km et jour pour tout le monde", async ({ page }) => {
    await connecter(page, "lucas.martin@exemple.fr");
    await page.goto("/recherche");
    await expect(page.getByLabel("Distance").locator("option")).toHaveText(["0,5 km", "1 km", "2 km"]);
    await choisirJour(page, "DIMANCHE");
    await expect(page.getByText("Courses pour Henri")).toBeVisible();
    await choisirJour(page, "LUNDI");
    await expect(page.getByText("Courses pour Henri")).toHaveCount(0);
});

test("Besoin : le texte s'écrit tout seul à partir de ce qui est rempli, pour un proche", async ({ page }) => {
    await connecter(page, "camille.moreau@exemple.fr");
    await page.goto("/besoins/nouveau");
    await expect(page.getByText(/Pour Madeleine\./)).toBeVisible();
    const texte = page.getByLabel(/Le texte de l'annonce/);
    await expect(texte).toHaveValue("");
    await page.getByRole("group", { name: "Filtrer par service" }).getByRole("button", { name: "Courses" }).click();
    await expect(texte).toHaveValue("Bonjour, je cherche un jeune du quartier pour faire les courses de Madeleine. Merci beaucoup !");
    await page.getByRole("group", { name: "Précision du besoin" }).getByRole("button", { name: "Pharmacie" }).click();
    const date = page.locator('select[name="date"]');
    await date.selectOption({ index: 3 });
    const jour = (await date.locator("option:checked").textContent()).trim().toLowerCase();
    await remplirHeure(page, "Début", "10:00");
    await remplirHeure(page, "Fin", "11:30");
    await expect(texte).toHaveValue(`Bonjour, je cherche un jeune du quartier pour faire les courses de Madeleine (pharmacie) le ${jour} de 10h à 11h30. Merci beaucoup !`);
    await page.getByRole("button", { name: "Autre proposition" }).click();
    await expect(texte).toHaveValue(/coup de main pour faire les courses de Madeleine \(pharmacie\)/);
    await texte.fill("Le code de l'immeuble est 1234B.");
    await date.selectOption({ index: 5 });
    await expect(texte).toHaveValue("Le code de l'immeuble est 1234B.");
    await page.getByRole("button", { name: "Écrire le texte de l'annonce" }).click();
    await expect(texte).toHaveValue(/faire les courses de Madeleine \(pharmacie\)/);
});

test("Besoin : pour soi-même, le texte parle à la première personne", async ({ page }) => {
    await connecter(page, "henri.lacroix@exemple.fr");
    await page.goto("/besoins/nouveau");
    await page.getByRole("group", { name: "Filtrer par service" }).getByRole("button", { name: "Animaux" }).click();
    await expect(page.getByLabel(/Le texte de l'annonce/)).toHaveValue("Bonjour, je cherche un jeune du quartier pour m'occuper de mon animal. Merci beaucoup !");
});

test("Demandes : les annonces d'aide ont leur propre onglet", async ({ page }) => {
    await connecter(page, "camille.moreau@exemple.fr");
    await page.goto("/services");
    await page.getByRole("tab", { name: /Annonces/ }).click();
    await expect(page.locator(".carte-besoin").first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Publier un besoin/ })).toBeVisible();
});

test("Demandes : une demande sans réponse dont la date est passée devient « Expirée »", async ({ page }) => {
    await page.addInitScript(() => {
        const db = JSON.parse(localStorage.getItem("vdo-db") || "null");
        if (db && !db.passe) {
            db.demandes["demande-01"].dateSouhaitee = "2020-01-04";
            db.passe = true;
            localStorage.setItem("vdo-db", JSON.stringify(db));
        }
    });
    await connecter(page, "lucas.martin@exemple.fr");
    await page.goto("/demandes/demande-01");
    await expect(page.getByText("Expirée").first()).toBeVisible();
    await expect(page.getByRole("button", { name: /Accepter/ })).toHaveCount(0);
    await page.goto("/services");
    await page.getByRole("tab", { name: "Historique" }).click();
    await expect(page.locator(".carte-suivi").filter({ hasText: "Expirée" }).first()).toBeVisible();
});
