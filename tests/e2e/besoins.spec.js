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

test("US44 · Assistant : personne n'est libre, on prévient les jeunes sans écrire d'annonce, le besoin leur est visible", async ({ page }) => {
    await connecter(page, "camille.moreau@exemple.fr");
    await page.goto("/recherche");
    await page.getByLabel("Dites ce qu'il vous faut").fill("Un jeune pour monter un petit meuble de chevet vendredi soir");
    await page.getByRole("button", { name: "Chercher" }).click();
    await expect(page.locator(".assistant-compris")).toContainText(/Bricolage · Meuble à monter · vendredi \d+ \S+ · le soir, 18:00-20:00/);
    await expect(page.getByText("Personne n'est libre le vendredi pour bricolage.")).toBeVisible();
    await page.getByRole("button", { name: "Prévenir les jeunes du quartier" }).click();
    await expect(page.getByRole("heading", { name: /Bricolage/ })).toBeVisible();
    await expect(page.getByText("Pas encore de proposition.")).toBeVisible();
    await deconnecter(page);
    await connecter(page, "lucas.martin@exemple.fr");
    await page.goto("/recherche");
    await page.getByRole("group", { name: "Filtrer par service" }).getByRole("button", { name: "Bricolage" }).click();
    await expect(page.getByText("Un jeune pour monter un petit meuble de chevet")).toBeVisible();
});

test("Assistant : « mes courses samedi matin » montre les jeunes libres, la demande est préremplie", async ({ page }) => {
    await connecter(page, "camille.moreau@exemple.fr");
    await page.getByRole("link", { name: /De quoi Madeleine a besoin/ }).click();
    await expect(page.getByLabel("Dites ce qu'il vous faut")).toBeFocused();
    await page.getByLabel("Dites ce qu'il vous faut").fill("je cherche un jeune pour mes courses samedi matin");
    await page.getByLabel("Dites ce qu'il vous faut").press("Enter");
    await expect(page.locator(".assistant-compris")).toContainText(/Courses · samedi \d+ \S+ · le matin, 09:00-12:00/);
    const premier = page.locator(".carte-profil").first();
    await expect(premier).toContainText("Libre le samedi");
    for (const t of await page.locator(".carte-raisons em:first-child").allTextContents()) expect(t).toMatch(/^Libre le samedi/);
    await premier.click();
    await page.getByRole("link", { name: /Envoyer une demande/ }).click();
    await expect(page.getByLabel(/Créneau proposé/)).toHaveValue(/.+/);
    await expect(page.getByLabel(/Créneau proposé/).locator("option:checked")).toContainText("Samedi");
    await expect(page.getByLabel(/Un détail à préciser/)).toHaveValue(/Je cherche un jeune pour mes courses samedi matin/);
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
    await page.locator(".carte-proposition", { hasText: "Lucas" }).getByRole("link", { name: "Lui envoyer une demande" }).click();
    await expect(page).toHaveURL(/jeunes\/jeune-01\/demande/);
    await expect(page.getByLabel(/Un détail à préciser/)).toHaveValue(/rosiers/);
});

test("US44 · Publier une annonce de besoin : obligatoire de choisir un service et décrire, puis visible des jeunes", async ({ page }) => {
    await connecter(page, "camille.moreau@exemple.fr");
    await page.goto("/besoins/nouveau");
    await page.getByRole("button", { name: /Publier mon annonce/ }).click();
    await expect(page.getByRole("alert")).toContainText("Choisissez le service");
    await page.getByRole("button", { name: "Bricolage" }).click();
    await page.getByLabel(/Décrivez votre besoin/).fill("Monter un petit meuble de chevet chez Madeleine.");
    await page.getByLabel("Date").selectOption({ label: await page.getByLabel("Date").locator("option", { hasText: /^Samedi/ }).first().textContent() });
    await page.getByRole("button", { name: /Publier mon annonce/ }).click();
    await expect(page.getByRole("heading", { name: /Bricolage/ })).toBeVisible();
    await expect(page.getByText("Pas encore de proposition.")).toBeVisible();
    await deconnecter(page);
    await connecter(page, "lucas.martin@exemple.fr");
    await page.goto("/recherche");
    await page.getByRole("group", { name: "Filtrer par service" }).getByRole("button", { name: "Bricolage" }).click();
    await expect(page.getByText("Monter un petit meuble de chevet")).toBeVisible();
});

test("US46 · Dictée vocale dans l'annonce : le senior parle, l'annonce s'écrit et le service et le créneau se remplissent", async ({ page }) => {
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
    await expect(page.getByLabel("Date").locator("option:checked")).toHaveText(/^Samedi/);
    await expect(page.getByLabel("Début")).toHaveValue("10:00");
    await expect(page.getByLabel("Fin")).toHaveValue("12:00");
    await expect(page.getByText(/Rempli d'après votre texte/)).toContainText(/Courses · Marché · Samedi \d+ \S+ · 10:00-12:00/);
    await page.getByRole("button", { name: "Bricolage" }).click();
    await page.getByLabel(/Décrivez votre besoin/).fill("Porter les courses");
    await expect(page.getByRole("button", { name: "Bricolage" })).toHaveAttribute("aria-pressed", "true");
    await page.getByRole("button", { name: /Publier mon annonce/ }).click();
    await expect(page.getByRole("heading", { name: /Bricolage/ })).toBeVisible();
});

test("Annonce sans dictée : la saisie au clavier remplit quand même le service", async ({ page }) => {
    await page.addInitScript(() => { delete window.SpeechRecognition; delete window.webkitSpeechRecognition; });
    await connecter(page, "camille.moreau@exemple.fr");
    await page.goto("/besoins/nouveau");
    await expect(page.getByRole("button", { name: /Dicter/ })).toHaveCount(0);
    await page.getByLabel(/Décrivez votre besoin/).fill("Aider ma mère à faire un appel vidéo sur sa tablette demain après-midi");
    await expect(page.getByRole("button", { name: "Informatique" })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByLabel("Début")).toHaveValue("14:00");
});

test("Photos : les profils sans photo ont un avatar illustré, pas une initiale", async ({ page }) => {
    await connecter(page, "camille.moreau@exemple.fr");
    await page.goto("/recherche");
    await page.getByLabel("Distance").selectOption("2");
    await expect(page.locator(".carte-profil").first()).toBeVisible();
    await expect(page.locator(".initial-avatar")).toHaveCount(0);
});

test("US46 · Dictée vocale : le senior parle, l'assistant comprend le service, le jour et l'heure", async ({ page }) => {
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
    await page.goto("/recherche");
    await page.getByRole("button", { name: /Le dire au micro/ }).click();
    await expect(page.getByLabel("Dites ce qu'il vous faut")).toHaveValue(/porter mes courses/);
    await expect(page.locator(".assistant-compris")).toContainText(/Courses( · [^·]+)? · samedi \d+ \S+ · 10:00-12:00/);
    await expect(page.locator(".carte-profil").first()).toContainText("Libre le samedi");
});

test("Dictée absente si le navigateur ne la gère pas, la saisie au clavier suffit à l'assistant", async ({ page }) => {
    await page.addInitScript(() => { delete window.SpeechRecognition; delete window.webkitSpeechRecognition; });
    await connecter(page, "camille.moreau@exemple.fr");
    await page.goto("/recherche");
    await expect(page.getByRole("button", { name: /Le dire au micro/ })).toHaveCount(0);
    await page.getByLabel("Dites ce qu'il vous faut").fill("Aider ma mère à faire un appel vidéo sur sa tablette lundi après-midi");
    await page.getByRole("button", { name: "Chercher" }).click();
    await expect(page.locator(".assistant-compris")).toContainText(/Informatique · Appel vidéo · lundi \d+ \S+ · l'après-midi, 14:00-17:00/);
    await page.getByRole("group", { name: "Filtrer par service" }).getByRole("button", { name: "Courses" }).click();
    await expect(page.locator(".assistant-compris")).toHaveCount(0);
});

test("Accueil : première impression avec services et jeunes à la une", async ({ page }) => {
    await connecter(page, "camille.moreau@exemple.fr");
    await expect(page.getByRole("heading", { name: /Petits services/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /De quoi Madeleine a besoin/ })).toBeVisible();
    await page.getByRole("list", { name: "Services" }).getByRole("listitem").filter({ hasText: "Jardinage" }).click();
    await expect(page).toHaveURL(/recherche\?service=JARDINAGE/);
    await page.goto("/accueil");
    await expect(page.getByRole("list", { name: "Jeunes à la une" }).getByRole("listitem").first()).toBeVisible();
    await expect(page.getByText("Comment ça marche")).toHaveCount(0);
    await deconnecter(page);
    await connecter(page, "lucas.martin@exemple.fr");
    await expect(page.getByRole("list", { name: "Besoins à la une" })).toContainText("Madeleine");
});

test("Accueil d'un nouveau compte : la grande action est visible", async ({ page }) => {
    await page.goto("/inscription");
    await page.getByRole("button", { name: /Je cherche de l'aide/ }).click();
    await page.getByRole("button", { name: /Continuer/ }).click();
    for (const [l, v] of Object.entries({ "Prénom": "Rose", "Nom": "Perrin", "E-mail": "rose.perrin@exemple.fr", "Téléphone": "04 78 11 22 33", "Adresse": "3 rue Paul Bert", "Code postal": "69003", "Ville": "Lyon" })) await page.getByLabel(l, { exact: true }).fill(v);
    await page.getByLabel(/J'accepte la/).check();
    await page.getByRole("button", { name: /Recevoir le lien/ }).click();
    await page.getByRole("link", { name: "Ouvrir le lien reçu" }).click();
    await page.waitForURL("**/accueil");
    await expect(page.getByRole("link", { name: /De quoi avez-vous besoin/ })).toBeVisible();
});

test("US46 · Dictée pour le jeune aussi : il dicte son annonce, ses services et son créneau sont reconnus", async ({ page }) => {
    await page.addInitScript(() => {
        window.SpeechRecognition = class {
            start() {
                setTimeout(() => {
                    const resultat = [{ transcript: "je suis étudiant, je peux faire les courses et aider sur l'ordinateur le samedi de 9h à 12h" }];
                    resultat.isFinal = true;
                    this.onresult({ resultIndex: 0, results: [resultat] });
                    this.onend();
                }, 50);
            }
            stop() { this.onend(); }
            abort() {}
        };
    });
    await connecter(page, "lucas.martin@exemple.fr");
    await page.goto("/annonce");
    await page.getByRole("button", { name: /Dicter mon annonce/ }).click();
    await expect(page.getByLabel(/Présentation courte/)).toHaveValue(/Je suis étudiant/);
    await expect(page.getByRole("button", { name: /Courses/ })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("button", { name: /Informatique/ })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByLabel("Début")).toHaveValue("09:00");
    await expect(page.getByText(/Compris/)).toContainText(/Samedi \d+ \S+ 09:00-12:00/);
    await expect(page.locator('select[name="date"] option:checked')).toHaveText(/^Samedi \d+/);
});
