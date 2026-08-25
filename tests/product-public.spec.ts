import { expect, test } from "@playwright/test";

test("protected product routes send signed-out users to login", async ({
  page,
}) => {
  await page.goto("/app");
  await expect(page).toHaveURL(/\/login$/);
  await expect(
    page.getByRole("heading", { name: "Welcome back" }),
  ).toBeVisible();
});

test("email auth pages are complete and responsive", async ({ page }) => {
  await page.goto("/signup");
  await expect(
    page.getByRole("heading", { name: "Create your account" }),
  ).toBeVisible();
  await expect(page.getByLabel("Full name")).toBeVisible();
  await expect(page.getByLabel("Work email")).toBeVisible();
  await expect(page.getByLabel("Password", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Continue with Google" }),
  ).toBeEnabled();
  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);

  await page.getByLabel("Full name").fill("Test Owner");
  await page.getByLabel("Work email").fill("owner@example.com");
  await page.getByLabel("Password", { exact: true }).fill("short");
  await page.getByLabel("Confirm password").fill("short");
  await page.getByRole("button", { name: "Create Account" }).click();
  await expect(
    page.getByText("Password must be at least 8 characters.", { exact: true }),
  ).toBeVisible();

  await page.getByRole("link", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.getByRole("link", { name: "Forgot password?" }).click();
  await expect(page).toHaveURL(/\/forgot-password$/);
  await expect(
    page.getByRole("heading", { name: "Reset your password" }),
  ).toBeVisible();
});

test("invite flow preserves the secure token through authentication", async ({
  page,
}) => {
  const token = "this-is-a-development-invitation-token";
  await page.goto(`/invite/${token}`);
  await expect(
    page.getByRole("heading", { name: "Join your company workspace" }),
  ).toBeVisible();
  const signIn = page.getByRole("link", { name: "Sign in to continue" });
  await expect(signIn).toHaveAttribute(
    "href",
    `/login?next=%2Finvite%2F${token}`,
  );
  await signIn.click();
  await expect(page).toHaveURL(new RegExp(`/login\\?next=.*invite`));
  const createAccount = page.getByRole("link", { name: "Create an account" });
  await expect(createAccount).toHaveAttribute(
    "href",
    `/signup?next=%2Finvite%2F${token}`,
  );
});

test("product APIs reject unauthenticated requests without leaking details", async ({
  request,
}) => {
  const endpoints = [
    [
      "/api/onboarding",
      {
        name: "Test",
        industry: "Services",
        employeeCount: 1,
        ownerRole: "Owner",
        businessDescription: "A local service business.",
        repeatedWork: "Customer intake and scheduling.",
        hardestToHandoff: "Preparing estimates.",
        commonQuestions: "Discount approvals.",
        ownerGoal: "Delegate routine work.",
      },
    ],
    [
      "/api/processes",
      { title: "Test", inputType: "text", explanation: "First do the work." },
    ],
    ["/api/ask", { question: "What is our refund policy?" }],
    [
      "/api/recommendations",
      {
        businessDescription: "A local service business.",
        repeatedWork: "Customer intake.",
        hardestToHandoff: "Preparing estimates.",
      },
    ],
    ["/api/team/invites", { email: "employee@example.com" }],
  ] as const;
  for (const [url, data] of endpoints) {
    const response = await request.post(url, { data });
    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body.error).toBe("Please sign in again.");
    expect(JSON.stringify(body)).not.toContain("stack");
  }
});
