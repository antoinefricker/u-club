import { test, expect } from "@playwright/test";
import { createVerifiedUser } from "./helpers";

let testCounter = 0;

function createTestUser() {
  testCounter++;
  return {
    displayName: "Account Test User",
    email: `account-${Date.now()}-${testCounter}@test.com`,
    password: "password123",
  };
}

test.describe("Account update", () => {
  let testUser: ReturnType<typeof createTestUser>;

  test.beforeEach(async ({ page, request }) => {
    testUser = createTestUser();

    await createVerifiedUser(request, testUser);

    await page.goto("/");
    await page.getByLabel("Email").fill(testUser.email);
    await page.getByRole("textbox", { name: "Password" }).fill(testUser.password);
    await page.getByRole("button", { name: "Connect" }).click();
    await expect(page.getByText(testUser.displayName)).toBeVisible();

    await page.getByText("Edit account").click();
    await expect(
      page.getByRole("heading", { name: "My Account" }),
    ).toBeVisible();
  });

  test("should display form with current user data", async ({ page }) => {
    await expect(page.getByLabel("Display name")).toHaveValue(
      testUser.displayName,
    );
    await expect(page.getByLabel("Email")).toHaveValue(testUser.email);
  });

  test("should update display name", async ({ page }) => {
    await page.getByLabel("Display name").clear();
    await page.getByLabel("Display name").fill("Updated Name");
    await page.getByRole("button", { name: "Save", exact: true }).click();

    await expect(page.getByText("Account updated")).toBeVisible();
  });

  test("should show error for empty display name", async ({ page }) => {
    await page.getByLabel("Display name").clear();
    await page.getByRole("button", { name: "Save", exact: true }).click();

    await expect(page.getByText("Display name is required")).toBeVisible();
  });

  test("should show error for invalid email", async ({ page }) => {
    await page.getByLabel("Email").clear();
    await page.getByLabel("Email").fill("not-an-email");
    await page.getByRole("button", { name: "Save", exact: true }).click();

    await expect(page.getByText("Invalid email")).toBeVisible();
  });
});
