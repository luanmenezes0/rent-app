import { test, expect } from "@playwright/test";
import { faker } from "@faker-js/faker";
import bcrypt from "bcryptjs";

import { cleanupUser } from "../support/helpers";

test.afterEach(({}, testInfo) => {
  const email = testInfo.annotations.find(
    (a) => a.type === "user-email",
  )?.description;
  if (email) cleanupUser(email);
});

test("should allow you to register and login", async ({ page }, testInfo) => {
  const loginForm = {
    email: `${faker.internet.userName()}@example.com`,
    password: faker.internet.password(),
  };

  testInfo.annotations.push({
    type: "user-email",
    description: loginForm.email,
  });

  const hash = await bcrypt.hash(process.env.USER_SECRET!, 10);

  await page.goto(`/join?token=${encodeURIComponent(hash)}`);
  await page.getByRole("textbox", { name: /E-mail/i }).fill(loginForm.email);
  await page.getByLabel("senha").fill(loginForm.password);
  await page.getByRole("button", { name: /criar conta/i }).click();

  await expect(page).toHaveURL("/");
});
