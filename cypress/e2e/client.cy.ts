import { faker } from "@faker-js/faker";

describe("Client", () => {
  afterEach(() => {
    cy.cleanupUser();
  });

  it("should create client", () => {
    const client = {
      name: faker.person.fullName(),
      email: faker.internet.email(),
      phone: faker.phone.number(),
      address: faker.location.streetAddress(),
      city: faker.location.city(),
      registrationNumber: faker.number.int(9),
      neighborhood: faker.location.county(),
      state: faker.location.state(),
    };

    cy.login();

    cy.visitAndCheck("/");

    cy.findByRole("link", { name: /clientes/i }).click();

    cy.findByRole("button", { name: /criar cliente/i }).click();

    cy.findByRole("dialog").should("be.visible");

    cy.findByRole("textbox", { name: /cpf/i }).type(client.registrationNumber.toString());
    cy.findByRole("textbox", { name: /nome/i }).type(client.name);
    cy.findByRole("textbox", { name: /endereço/i }).type(client.address);
    cy.findByRole("textbox", { name: /bairro/i }).type(client.neighborhood);
    cy.findByRole("textbox", { name: /cidade/i }).type(client.city);
    cy.findByRole("textbox", { name: /telefone/i }).type(client.phone);
    cy.findByRole("textbox", { name: /uf/i }).type(client.state);

    cy.findByRole("dialog").within(() =>
      cy.findByRole("button", { name: /salvar/i }).click(),
    );
  });
});
