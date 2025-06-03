import { test, expect } from "@playwright/test";
import { faker } from "@faker-js/faker";
import { login, cleanupUser } from "../support/helpers";

test.afterEach(({}, testInfo) => {
  const email = testInfo.annotations.find(
    (a) => a.type === "user-email",
  )?.description;
  if (email) cleanupUser(email);
});

test("should create client", async ({ page }, testInfo) => {
  const { email } = await login(page);
  testInfo.annotations.push({ type: "user-email", description: email });

  const client = {
    name: faker.person.fullName(),
    email: faker.internet.email(),
    phone: faker.phone.number(),
    address: faker.location.streetAddress(),
    city: faker.location.city(),
    registrationNumber: faker.number.int({ max: 999999999 }).toString(),
    neighborhood: faker.location.county(),
    state: faker.location.state(),
  };

  await page.goto("/");
  await page.getByRole("link", { name: /clientes/i }).click();
  await page.getByRole("button", { name: /criar cliente/i }).click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();

  await dialog
    .getByRole("textbox", { name: /cpf/i })
    .fill(client.registrationNumber);
  await dialog.getByRole("textbox", { name: /nome/i }).fill(client.name);
  await dialog.getByRole("textbox", { name: /endereço/i }).fill(client.address);
  await dialog
    .getByRole("textbox", { name: /bairro/i })
    .fill(client.neighborhood);
  await dialog.getByRole("textbox", { name: /cidade/i }).fill(client.city);
  await dialog.getByRole("textbox", { name: /telefone/i }).fill(client.phone);
  await dialog.getByRole("textbox", { name: /uf/i }).fill(client.state);

  await dialog.getByRole("button", { name: /salvar/i }).click();
});
