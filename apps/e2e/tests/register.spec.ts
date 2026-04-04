import { test, expect } from "@playwright/test";

test.describe("Registration", () => {
  test("should create a new account and auto-login", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("button", { name: "Create an account" }).click();
    await page.getByLabel("Display name").fill("New User");
    await page.getByLabel("Email").fill(`register-${Date.now()}@test.com`);
    await page.getByLabel("Password").fill("password123");
    await page.getByRole("button", { name: "Create my account" }).click();

    await expect(page.getByText("New User")).toBeVisible();
  });

  test("should show error for missing display name", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("button", { name: "Create an account" }).click();
    await page.getByLabel("Email").fill("test@test.com");
    await page.getByLabel("Password").fill("password123");
    await page.getByRole("button", { name: "Create my account" }).click();

    await expect(page.getByText("Display name is required")).toBeVisible();
  });

  test("should show error for invalid email", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("button", { name: "Create an account" }).click();
    await page.getByLabel("Display name").fill("Test");
    await page.getByLabel("Email").fill("not-an-email");
    await page.getByLabel("Password").fill("password123");
    await page.getByRole("button", { name: "Create my account" }).click();

    await expect(page.getByText("Invalid email")).toBeVisible();
  });

  test("should show error for short password", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("button", { name: "Create an account" }).click();
    await page.getByLabel("Display name").fill("Test");
    await page.getByLabel("Email").fill("test@test.com");
    await page.getByLabel("Password").fill("123");
    await page.getByRole("button", { name: "Create my account" }).click();

    await expect(
      page.getByText("Password must be at least 6 characters"),
    ).toBeVisible();
  });
});
