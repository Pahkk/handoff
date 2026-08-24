import { expect, test } from "@playwright/test";

test("page renders without overflow and navigation works", async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("doesn't depend on you");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);

  if (testInfo.project.name === "desktop") {
    await page.getByRole("link", { name: "How It Works", exact: true }).click();
    await expect(page).toHaveURL(/#how-it-works$/);
  } else {
    await page.getByRole("button", { name: "Toggle navigation menu" }).click();
    await expect(page.getByRole("navigation", { name: "Mobile navigation" })).toBeVisible();
    await page.getByRole("link", { name: "Pricing" }).click();
    await expect(page).toHaveURL(/#pricing$/);
  }

  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: `test-results/${testInfo.project.name}-page.png`, fullPage: true });
});

test("early access validates and stores a submission", async ({ page }) => {
  await page.goto("/");
  const ctas = page.getByRole("button", { name: "Get Early Access" });
  await ctas.first().click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();

  await dialog.getByRole("button", { name: "Request Early Access" }).click();
  await expect(dialog.getByLabel("First name")).toBeFocused();
  await dialog.getByLabel("First name").fill("Alex");
  await dialog.getByLabel("Work email").fill("alex@example.com");
  await dialog.getByLabel("Business name").fill("Northstar Services");
  await dialog.getByLabel("Industry").selectOption({ label: "Home services" });
  await dialog.getByLabel("Number of employees").selectOption({ label: "4–10" });
  await dialog.getByLabel("Are you currently hiring?").selectOption({ label: "Within 3 months" });
  await dialog.getByLabel("What is hardest for you to hand off?").fill("Quoting unusual jobs and handling exceptions.");
  await dialog.getByRole("button", { name: "Request Early Access" }).click();
  await expect(page.getByTestId("submission-success")).toContainText("You're on the list");
  const stored = await page.evaluate(() => localStorage.getItem("opryn-early-access"));
  expect(stored).toContain("Northstar Services");
});

test("FAQ accordion opens and closes", async ({ page }) => {
  await page.goto("/");
  const question = page.getByRole("button", { name: "Do I have to document everything myself?" });
  await question.click();
  await expect(question).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByText("The goal is the opposite.")).toBeVisible();
  await question.click();
  await expect(question).toHaveAttribute("aria-expanded", "false");
});

test("Google sign in opens an accessible auth flow", async ({ page }, testInfo) => {
  await page.goto("/");
  if (testInfo.project.name === "mobile") {
    await page.getByRole("button", { name: "Toggle navigation menu" }).click();
  }

  await page.getByRole("button", { name: "Sign In" }).click();
  const dialog = page.getByRole("dialog", { name: "Sign in or create an account" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Continue with Google" })).toBeEnabled();
  await expect(dialog.getByRole("link", { name: "Terms" })).toHaveAttribute("href", "/terms");
  await expect(dialog.getByRole("link", { name: "Privacy Policy" })).toHaveAttribute("href", "/privacy");
  await dialog.getByRole("button", { name: "Close sign in" }).click();
  await expect(dialog).not.toBeVisible();
});

test("public legal pages are linked and accessible", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Privacy", exact: true }).click();
  await expect(page).toHaveURL(/\/privacy$/);
  await expect(page.getByRole("heading", { name: "Privacy Policy", level: 1 })).toBeVisible();
  await expect(page.getByText(/does not request access to your Gmail/)).toBeVisible();

  await page.getByRole("link", { name: "Terms", exact: true }).click();
  await expect(page).toHaveURL(/\/terms$/);
  await expect(page.getByRole("heading", { name: "Terms of Service", level: 1 })).toBeVisible();
});
