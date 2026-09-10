import { chromium, test, expect, type Page } from "@playwright/test";
import PocketBase from "pocketbase";

// Credentials come from the environment (same names as .env). The dev server
// (`bun run dev`) must be running — it boots PocketBase with seed data.
// Example: set -a; source .env; set +a; bun run test:e2e
const email = process.env.PB_TESTUSER_EMAIL || process.env.PB_SUPERUSER_EMAIL || "";
const password = process.env.PB_TESTUSER_PASSWORD || process.env.PB_SUPERUSER_PASSWORD || "";
if (!email || !password) throw new Error("Set PB_TESTUSER_* or PB_SUPERUSER_* in the environment (see .env.example)");

const ts = Date.now();
const title = `e2e post ${ts}`;
const pb = new PocketBase(process.env.PB_URL || "http://localhost:5173");

async function doLogin(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page.getByRole("link", { name: "New post" })).toBeVisible();
}

test("blog logged out", async ({ page }) => {
  await page.goto("/blog");
  await expect(page.getByRole("heading", { name: "Blog" })).toBeVisible();
  await expect(page.getByRole("link", { name: "New post" })).toHaveCount(0);
});

test("login and logout", async ({ page }) => {
  await doLogin(page);
  await page.getByRole("link", { name: `Profile for ${email}` }).click();
  await page.getByRole("button", { name: "Logout" }).click();
  await expect(page.getByRole("link", { name: "Login" })).toBeVisible();
});

test("signup", async ({ page }) => {
  const signupEmail = `signup-${ts}@test.com`;
  await page.goto("/login");
  await page.getByRole("tab", { name: "Sign up" }).click();
  await page.getByLabel("Email").fill(signupEmail);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("Confirm password").fill(password);
  await page.getByLabel("Name").fill("E2E Signup");
  await page.getByRole("button", { name: "Sign up" }).click();
  await expect(page.getByRole("link", { name: "New post" })).toBeVisible();
  // Cleanup: re-auth as superuser to delete the test user.
  await pb.collection("_superusers").authWithPassword(email, password);
  const u = await pb.collection("users").getFirstListItem(`email="${signupEmail}"`);
  await pb.collection("users").delete(u.id);
});

test("create post", async ({ page }) => {
  // Second browser to verify the realtime subscription.
  const b2 = await (await chromium.launch()).newPage();
  await b2.goto("/blog");

  await page.goto("/blog");
  await doLogin(page);
  await page.getByRole("link", { name: "New post" }).click();
  await expect(page).toHaveURL(/\/blog\/new$/);
  await page.getByLabel("Title").fill(title);
  await page.getByLabel("Excerpt").fill("created by the e2e suite");
  await page.getByLabel("Body").fill("line 1\nline 2");
  await page.getByLabel("Status").selectOption("published");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page).toHaveURL(/\/blog\/.+/);
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
  // Realtime: the second browser's list gains the post without reload.
  await expect(b2.getByRole("link", { name: title })).toBeVisible();
  await b2.close();
});

test("edit post", async ({ page }) => {
  await page.goto("/blog");
  await doLogin(page);
  await page.getByRole("link", { name: title }).first().click();
  await page.getByRole("link", { name: "Edit post" }).click();
  await expect(page).toHaveURL(/\/edit$/);
  await page.getByLabel("Title").fill(`${title} (edited)`);
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByRole("heading", { name: `${title} (edited)` })).toBeVisible();
});

test("delete post", async ({ page }) => {
  await page.goto("/blog");
  await doLogin(page);
  await page.getByRole("link", { name: `${title} (edited)` }).first().click();
  await page.getByRole("button", { name: "Delete" }).click();
  await page.getByRole("button", { name: "Yes, delete" }).click();
  await expect(page).toHaveURL(/\/blog$/);
  await expect(page.getByRole("link", { name: `${title} (edited)` })).toHaveCount(0);
});
