import { execSync } from "child_process";
import { faker } from "@faker-js/faker";
import { Page } from "@playwright/test";

const BASE_URL =
  process.env.PLAYWRIGHT_TEST_BASE_URL || "http://localhost:3000";

export async function login(
  page: Page,
  email: string = faker.internet.email(undefined, undefined, "example.com"),
) {
  const output = execSync(
    `npx tsx --require tsconfig-paths/register ./playwright/support/create-user.ts "${email}"`,
  ).toString();
  const match = /<cookie>(?<cookieValue>.*)<\/cookie>/.exec(output);
  const cookieValue = match?.groups?.cookieValue.trim();
  if (!cookieValue) throw new Error("Cookie not found");
  await page
    .context()
    .addCookies([{ name: "__session", value: cookieValue, url: BASE_URL }]);
  return { email };
}

export function cleanupUser(email: string) {
  execSync(
    `npx tsx --require tsconfig-paths/register ./playwright/support/delete-user.ts "${email}"`,
  );
}
