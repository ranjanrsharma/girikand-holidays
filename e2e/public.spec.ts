import { expect, test } from "@playwright/test";

test("listing shows the two seeded packages", async ({ page }) => {
  await page.goto("/holidays");
  await expect(page.getByTestId("package-card")).toHaveCount(2);
  await expect(page.getByTestId("result-count")).toContainText("2 Family Holidays Packages");
});

test("filtering by duration through the drawer shows only Goa", async ({ page }) => {
  await page.goto("/holidays");
  await page.getByRole("button", { name: "Filter your Tour" }).click();
  const dialog = page.getByRole("dialog", { name: "Filter your Tour" });
  await dialog.getByLabel(/4 to 6 days/).check();
  await dialog.getByRole("button", { name: "Apply" }).click();
  await expect(page).toHaveURL(/duration=4-6/);
  await expect(page.getByTestId("package-card")).toHaveCount(1);
  await expect(page.getByTestId("package-card")).toContainText("Goa Beach Resort Getaway");
  await expect(page.getByTestId("filter-chip")).toHaveCount(1);
});

test("sorting by price high to low puts Kutch first", async ({ page }) => {
  await page.goto("/holidays");
  await page.getByLabel("Sort by:").selectOption("price-desc");
  await expect(page).toHaveURL(/sort=price-desc/);
  await expect(page.getByTestId("package-card").first()).toContainText("Kutch White Desert Tent Stay");
});

test("Kutch cancellation table uses the selected price", async ({ page }) => {
  await page.goto("/holidays?sort=price-desc");
  await page.getByTestId("package-card").first().getByRole("link", { name: "View Details" }).click();
  await expect(page).toHaveURL(/\/package\/kutch-white-desert-tent-stay/);
  const price = Number(await page.getByTestId("cancel-price").getAttribute("data-price"));
  expect(price).toBeGreaterThan(0);
  const slab = page.getByTestId("slab-40");
  await expect(slab).toBeVisible();
  expect(Number(await slab.getAttribute("data-amount"))).toBe(Math.round(price * 0.4));
  await expect(slab).toContainText("40% deduction from tour amount");
});

test("enquiry modal validates and sends", async ({ page }) => {
  await page.goto("/package/kutch-white-desert-tent-stay");
  const open = () => page.getByRole("button", { name: "Enquire Now" }).first().click();
  const dialog = page.getByRole("dialog", { name: "Enquire now" });

  await open();
  await dialog.getByLabel("Full name *").fill("Asha Rao");
  await dialog.getByLabel("Mobile number *").fill("12345");
  await dialog.getByRole("button", { name: "Send Message" }).click();
  await expect(dialog.getByText("Enter a valid 10-digit Indian mobile number")).toBeVisible();

  await dialog.getByLabel("Mobile number *").fill("98765 43210");
  await dialog.getByRole("button", { name: "Send Message" }).click();
  await expect(dialog.getByTestId("enquiry-success")).toContainText("Thanks");

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});
