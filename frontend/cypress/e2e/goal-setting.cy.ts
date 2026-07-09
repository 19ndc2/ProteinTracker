const email = `cy_goal_e2e_${Date.now()}@test.com`;
const password = 'testpass123';
const displayName = 'Cypress Goal E2E Tester';

describe('Protein Goal Setting', () => {
  before(() => {
    cy.register(displayName, email, password);
  });

  beforeEach(() => {
    cy.login(email, password);
  });

  it('dashboard shows the default goal of 150g', () => {
    cy.get('.ring-label', { timeout: 8000 }).should('be.visible');
    cy.get('.ring-label').should('contain.text', '150');
  });

  it('clicking the edit button enters goal-edit mode', () => {
    cy.get('.ring-label', { timeout: 8000 }).should('be.visible');
    cy.get('.ring-text').trigger('mouseover');
    cy.get('.btn-edit-goal').click();

    cy.get('.goal-input', { timeout: 5000 }).should('be.visible');
  });

  it('saving a new goal updates the displayed goal', () => {
    cy.get('.ring-label', { timeout: 8000 }).should('be.visible');
    cy.get('.ring-text').trigger('mouseover');
    cy.get('.btn-edit-goal').click();

    cy.get('.goal-input').clear().type('200');
    cy.get('.btn-goal-save').click();

    cy.get('.ring-label', { timeout: 5000 }).should('be.visible');
    cy.get('.ring-label').should('contain.text', '200');
  });

  it('pressing Enter saves the goal', () => {
    cy.get('.ring-label', { timeout: 8000 }).should('be.visible');
    cy.get('.ring-text').trigger('mouseover');
    cy.get('.btn-edit-goal').click();

    cy.get('.goal-input').clear().type('180');
    cy.get('.goal-input').type('{enter}');

    cy.get('.ring-label', { timeout: 5000 }).should('be.visible');
    cy.get('.ring-label').should('contain.text', '180');
  });

  it('pressing Escape cancels without changing the goal', () => {
    cy.get('.ring-label', { timeout: 8000 }).should('be.visible');
    let originalText = '';
    cy.get('.ring-label')
      .invoke('text')
      .then((text) => {
        originalText = text.trim();
      });

    cy.get('.ring-text').trigger('mouseover');
    cy.get('.btn-edit-goal').click();

    cy.get('.goal-input').clear().type('999');
    cy.get('.goal-input').type('{esc}');

    cy.get('.ring-label', { timeout: 5000 }).should('be.visible');
    cy.get('.ring-label')
      .invoke('text')
      .then((text) => {
        expect(text.trim()).to.equal(originalText);
      });
  });

  it('cancel button restores the original goal', () => {
    cy.get('.ring-label', { timeout: 8000 }).should('be.visible');
    let originalText = '';
    cy.get('.ring-label')
      .invoke('text')
      .then((text) => {
        originalText = text.trim();
      });

    cy.get('.ring-text').trigger('mouseover');
    cy.get('.btn-edit-goal').click();

    cy.get('.goal-input').clear().type('999');
    cy.get('.btn-goal-cancel').click();

    cy.get('.ring-label', { timeout: 5000 }).should('be.visible');
    cy.get('.ring-label')
      .invoke('text')
      .then((text) => {
        expect(text.trim()).to.equal(originalText);
      });
  });

  it('goal persists after page reload', () => {
    cy.get('.ring-label', { timeout: 8000 }).should('be.visible');
    cy.get('.ring-text').trigger('mouseover');
    cy.get('.btn-edit-goal').click();

    cy.get('.goal-input').clear().type('220');
    cy.get('.btn-goal-save').click();

    cy.get('.ring-label', { timeout: 5000 }).should('contain.text', '220');

    cy.reload();
    cy.get('.ring-label', { timeout: 8000 }).should('be.visible');
    cy.get('.ring-label').should('contain.text', '220');
  });
});
