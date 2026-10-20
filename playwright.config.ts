import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "e2e",
  timeout: 30_000,
  fullyParallel: false,
  workers: 1,
  use: { baseURL: "http://localhost:3100", launchOptions: { executablePath: process.env.CHROMIUM_PATH ?? "/opt/pw-browsers/chromium" } },
  webServer: {
    command: "npm run dev -- -p 3100",
    url: "http://localhost:3100",
    reuseExistingServer: true,
    timeout: 120_000,
    env: { PGLITE_DIR: "memory", ADMIN_EMAIL: "admin@example.com", ADMIN_PASSWORD: "admin123" },
  },
});
