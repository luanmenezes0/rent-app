import { faker } from "@faker-js/faker";
import bcrypt from "bcryptjs";

describe("Login", () => {
  afterEach(() => {
    cy.cleanupUser();
  });

  // eslint-disable-next-line cypress/no-async-tests
  it("should allow you to register and login", async () => {
    const loginForm = {
      email: `${faker.internet.userName()}@example.com`,
      password: faker.internet.password(),
    };

    cy.then(() => ({ email: loginForm.email })).as("user");

    const hash = await bcrypt.hash(Cypress.env("USER_SECRET"), 10);

    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.visit(`/join?token=${encodeURIComponent(hash)}`).wait(1000);

    // cy.findByRole("link", { name: /cadastre-se/i }).click();

    cy.findByRole("textbox", { name: /E-mail/i }).type(loginForm.email);
    cy.findByLabelText(/senha/i).type(loginForm.password);
    cy.findByRole("button", { name: /criar conta/i }).click();
  });
});
