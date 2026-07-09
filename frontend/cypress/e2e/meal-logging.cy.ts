const email = `cy_meal_e2e_${Date.now()}@test.com`;
const password = 'testpass123';
const displayName = 'Cypress Meal E2E Tester';

describe('Meal Logging', () => {
  before(() => {
    cy.register(displayName, email, password);
  });

  beforeEach(() => {
    cy.login(email, password);
  });

  it('typing a meal and clicking Estimate shows a protein preview', () => {
    cy.enterMeal('2 chicken breasts');
    cy.get('.btn-log').click();

    cy.get('.preview-card', { timeout: 20000 }).should('be.visible');
    cy.get('.preview-confirmation').should('not.be.empty');

    cy.get('.preview-grams .grams-value')
      .invoke('text')
      .then((text) => {
        expect(Number(text.trim())).to.be.greaterThan(0);
      });
  });

  it("confirming an estimate logs the meal and shows it in Today's meals", () => {
    cy.enterMeal('2 chicken breasts');
    cy.get('.btn-log').click();

    cy.get('.preview-card', { timeout: 20000 }).should('be.visible');

    let expectedGrams = '';
    cy.get('.preview-grams .grams-value')
      .invoke('text')
      .then((text) => {
        expectedGrams = text.trim();
      });

    cy.get('.preview-actions .btn-primary').click();

    cy.get('.success-card', { timeout: 8000 }).should('be.visible');
    cy.get('.success-card').should('contain.text', 'Meal logged!');

    // entries list refreshes while the success card is still visible
    cy.get('.entries-card', { timeout: 8000 }).should('be.visible');
    cy.get('.entry-name').first().should('not.be.empty');
    cy.get('.entry-grams')
      .first()
      .should(($el) => {
        expect($el.text()).to.contain(`${expectedGrams}g`);
      });
  });

  it('clicking Try again discards the estimate and returns to the input', () => {
    cy.enterMeal('1 cup of Greek yogurt');
    cy.get('.btn-log').click();

    cy.get('.preview-card', { timeout: 20000 }).should('be.visible');

    cy.get('.preview-actions .btn-secondary').click();

    cy.get('.preview-card').should('not.exist');
    cy.get('.meal-input').should('be.visible');
  });

  it('confirming a meal updates the daily protein ring total', () => {
    let gramsBefore = 0;
    cy.get('.ring-total')
      .invoke('text')
      .then((text) => {
        gramsBefore = Number(text.trim()) || 0;
      });

    cy.enterMeal('3 eggs');
    cy.get('.btn-log').click();

    cy.get('.preview-card', { timeout: 20000 }).should('be.visible');
    let estimatedGrams = 0;
    cy.get('.preview-grams .grams-value')
      .invoke('text')
      .then((text) => {
        estimatedGrams = Number(text.trim());
      });

    cy.get('.preview-actions .btn-primary').click();
    cy.get('.success-card', { timeout: 8000 }).should('be.visible');

    cy.get('.ring-total', { timeout: 8000 }).should(($el) => {
      expect($el.text()).to.equal(String(gramsBefore + estimatedGrams));
    });
  });
});
