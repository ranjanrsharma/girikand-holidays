import { expect, test, type Page } from "@playwright/test";

const future = (days: number) => new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);

async function login(page: Page) {
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill("admin@example.com");
  await page.getByLabel("Password").fill("admin123");
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(/\/admin$/);
}

test.describe.serial("admin", () => {
  test.beforeAll(async ({ request }) => {
    // warm up the dev server so the first page compile does not interrupt a test
    for (const path of ["/admin/login", "/admin", "/admin/packages/new", "/admin/enquiries"]) await request.get(path);
  });

  test("unauthenticated /admin redirects to the login page", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin\/login$/);
    await page.goto("/admin/enquiries");
    await expect(page).toHaveURL(/\/admin\/login$/);
  });

  test("wrong password shows a generic error", async ({ page }) => {
    await page.goto("/admin/login");
    await page.getByLabel("Email").fill("admin@example.com");
    await page.getByLabel("Password").fill("not-the-password");
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(page.getByText("Wrong email or password")).toBeVisible();
    await expect(page).toHaveURL(/\/admin\/login$/);
  });

  test("correct login lands on the package list with 2 packages", async ({ page }) => {
    await login(page);
    await expect(page.getByRole("heading", { name: "Packages" })).toBeVisible();
    await expect(page.locator("tbody tr")).toHaveCount(2);
    await expect(page.getByText("Goa Beach Resort Getaway")).toBeVisible();
  });

  test("the slab validation rejects a gap", async ({ page }) => {
    await login(page);
    await page.goto("/admin/packages/new");
    await page.getByLabel("Title", { exact: true }).fill("Gap Test Trip");
    await page.getByLabel("Code").fill("GAP1");
    await page.getByRole("tab", { name: "Policies" }).click();
    await page.getByLabel("Slab 2 from days").fill("8"); // 6 and 7 days are now uncovered
    await expect(page.getByText(/Gap: nothing covers 6 to 7 days/)).toBeVisible();
    await page.getByRole("button", { name: "Save draft" }).click();
    await expect(page.getByText("Please fix the highlighted fields.")).toBeVisible();
    await expect(page.getByText(/Gap: nothing covers/).first()).toBeVisible();
    // resetting to the default slabs clears the problem
    await page.getByRole("button", { name: "Reset to default" }).first().click();
    await expect(page.getByText(/Gap: nothing covers/)).toHaveCount(0);
  });

  test("create a draft, refuse publishing without a departure, then publish with one", async ({ page }) => {
    await login(page);
    await page.goto("/admin/packages/new");
    await page.getByLabel("Title", { exact: true }).fill("E2E Test Trip");
    await expect(page.getByLabel("Slug (web address)")).toHaveValue("e2e-test-trip");
    await page.getByLabel("Code").fill("E2E1");
    await page.getByLabel("Days", { exact: true }).fill("1");
    await page.getByLabel("Nights", { exact: true }).fill("0");
    await page.getByRole("tab", { name: "Itinerary" }).click();
    await page.getByRole("button", { name: "Generate 1 empty days" }).click();
    await page.getByLabel("Day 1 title").fill("Arrive and explore");
    await page.getByLabel("Day 1 description").fill("A relaxed day around town.");
    await page.getByRole("button", { name: "Save draft" }).click();
    await expect(page.getByText("Package created as a draft.")).toBeVisible();
    await expect(page).toHaveURL(/\/admin\/packages\/\d+\?created=1/);

    // listed in the packages list
    await page.goto("/admin");
    await expect(page.locator("tbody tr")).toHaveCount(3);
    await expect(page.getByRole("link", { name: "E2E Test Trip", exact: true })).toBeVisible();

    // publishing without a departure is refused
    await page.getByRole("link", { name: "E2E Test Trip", exact: true }).click();
    await page.getByRole("tab", { name: "Media" }).click();
    await page.getByLabel("Publish without photo").check();
    await page.getByRole("button", { name: "Save and publish" }).click();
    await expect(page.getByRole("alert").filter({ hasText: "Cannot publish yet" })).toContainText("upcoming departure");

    // add a departure, then publish
    await page.getByRole("tab", { name: "Departures" }).click();
    await page.getByRole("button", { name: "Add departure" }).click();
    await page.getByLabel("Date for new departure").fill(future(30));
    await page.getByLabel("Departure city for new departure").fill("Mumbai");
    await page.getByLabel("Twin price for new departure").fill("12000");
    await page.getByRole("button", { name: "Save new departure" }).click();
    await expect(page.getByRole("cell", { name: "Mumbai" })).toBeVisible();
    await expect(page.getByRole("cell", { name: "₹12,000" }).first()).toBeVisible();

    await page.getByRole("tab", { name: "Media" }).click();
    await page.getByLabel("Publish without photo").check();
    await page.getByRole("button", { name: "Save and publish" }).click();
    await expect(page.getByText("Saved and published.")).toBeVisible();
    await expect(page.getByText("Status: published")).toBeVisible();

    await page.goto("/admin");
    const row = page.getByRole("row", { name: /E2E Test Trip/ });
    await expect(row).toContainText("published");
    await expect(row).toContainText("₹12,000");

    // clean up so the public tests (same in-memory database) still see only the two seeded packages
    await row.getByRole("button", { name: "Delete" }).click();
    await row.getByRole("button", { name: "Yes, delete" }).click();
    await expect(page.getByRole("row", { name: /E2E Test Trip/ })).toHaveCount(0);
  });

  test("logging out revokes the session even if the cookie is copied", async ({ page, context }) => {
    await login(page);
    const copied = await context.cookies();
    await page.getByRole("button", { name: "Log out" }).click();
    await expect(page).toHaveURL(/\/admin\/login$/);
    await context.addCookies(copied);
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin\/login$/);
  });

  test("the CSV export returns 401 when logged out", async ({ request }) => {
    const res = await request.get("/admin/enquiries/export");
    expect(res.status()).toBe(401);
  });
  // keep last: the lockout is per address and would block later logins in this run
  test("three wrong passwords lock the login, even for the right password", async ({ page }) => {
    for (let i = 0; i < 3; i++) {
      await page.goto("/admin/login");
      await page.getByLabel("Email").fill("admin@example.com");
      await page.getByLabel("Password").fill("wrong-" + i);
      await page.getByRole("button", { name: "Log in" }).click();
      await expect(page.getByRole("alert")).toBeVisible();
    }
    await page.goto("/admin/login");
    await page.getByLabel("Email").fill("admin@example.com");
    await page.getByLabel("Password").fill("admin123");
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(page.getByText(/Too many failed attempts/)).toBeVisible();
    await expect(page).toHaveURL(/\/admin\/login$/);
  });
});
