import { faker } from "@faker-js/faker";

describe("Client", () => {
  afterEach(() => {
    cy.cleanupUser();
  });

  it.only("should create client", () => {
    const client = {
      name: faker.name.fullName(),
      email: faker.internet.email(),
      phone: faker.phone.number(),
      address: faker.address.streetAddress(),
      city: faker.address.city(),
      registrationNumber: faker.random.numeric(9),
    };

    cy.login();

    cy.visitAndCheck("/");

    cy.findByRole("link", { name: /clientes/i }).click();

    cy.findByRole("button", { name: /criar cliente/i }).click();

    cy.findByRole("dialog").should("be.visible");

    cy.findByRole("textbox", { name: /nome/i }).type(client.name);
    cy.findByRole("textbox", { name: /endereço/i }).type(client.address);
    cy.findByRole("textbox", { name: /telefone/i }).type(client.phone);
    cy.findByRole("textbox", { name: /cnpj\/cpf/i }).type(
      client.registrationNumber
    );

    cy.findByRole("dialog").within(() =>
      cy.findByRole("button", { name: /salvar/i }).click()
    );
  });
});
