Cypress.Commands.add('register', (displayName: string, email: string, password: string) => {
  cy.visit('/register');
  cy.get('#displayName').type(displayName);
  cy.get('#email').type(email);
  cy.get('#password').type(password);
  cy.get('button[type="submit"]').click();
  cy.url({ timeout: 8000 }).should('match', /\/dashboard/);
});

Cypress.Commands.add('login', (email: string, password: string) => {
  cy.session([email, password], () => {
    cy.visit('/login');
    cy.get('#email').type(email);
    cy.get('#password').type(password);
    cy.get('button[type="submit"]').click();
    cy.url({ timeout: 8000 }).should('match', /\/dashboard/);
  });
  cy.visit('/dashboard');
});

Cypress.Commands.add('enterMeal', (text: string) => {
  cy.get('.meal-input', { timeout: 10000 }).should('be.visible').type(text);
  cy.get('.btn-log', { timeout: 5000 }).should('be.enabled');
});

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      register(displayName: string, email: string, password: string): Chainable<void>;
      login(email: string, password: string): Chainable<void>;
      enterMeal(text: string): Chainable<void>;
    }
  }
}
