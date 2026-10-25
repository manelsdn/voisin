const { defineConfig, devices } = require("@playwright/test");

module.exports = defineConfig({
    testDir: "./e2e",
    timeout: 30000,
    retries: 0,
    workers: 1,
    reporter: [["list"], ["json", { outputFile: "resultats/resultats.json" }], ["html", { outputFolder: "resultats/rapport", open: "never" }]],
    use: {
        baseURL: "http://localhost:3100",
        ...devices["Pixel 5"],
        screenshot: "only-on-failure"
    },
    webServer: {
        command: "npx react-scripts start",
        cwd: "..",
        url: "http://localhost:3100",
        timeout: 120000,
        reuseExistingServer: true,
        env: { PORT: "3100", BROWSER: "none", REACT_APP_MODE: "test" }
    }
});
