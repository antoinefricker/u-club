import { test, expect } from "@playwright/test";

const TEST_USER = {
  displayName: "Login Test User",
  email: `login-${Date.now()}@test.com`,
  password: "password123",
};

test.describe("Login", () => {
  test.beforeAll(async ({ request }) => {
    await request.post("/api/users", {
      data: {
        displayName: TEST_USER.displayName,
        email: TEST_USER.email,
        password: TEST_USER.password,
      },
    });
  });

  test("should login with valid credentials", async ({ page }) => {
    await page.goto("/");

    await page.getByLabel("Email").fill(TEST_USER.email);
    await page.getByLabel("Password").fill(TEST_USER.password);
    await page.getByRole("button", { name: "Connect" }).click();

    await expect(page.getByText(TEST_USER.displayName)).toBeVisible();
  });

  test("should show error for wrong password", async ({ page }) => {
    await page.goto("/");

    await page.getByLabel("Email").fill(TEST_USER.email);
    await page.getByLabel("Password").fill("wrongpassword");
    await page.getByRole("button", { name: "Connect" }).click();

    await expect(page.getByText("invalid email or password")).toBeVisible();
  });

  test("should show error for non-existent email", async ({ page }) => {
    await page.goto("/");

    await page.getByLabel("Email").fill("nonexistent@test.com");
    await page.getByLabel("Password").fill("password123");
    await page.getByRole("button", { name: "Connect" }).click();

    await expect(page.getByText("invalid email or password")).toBeVisible();
  });
});
