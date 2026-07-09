// Unique email per test run so re-runs don't hit "already registered"
const email = `cy_e2e_${Date.now()}@test.com`;
const password = 'testpass123';
const displayName = 'Cypress E2E Tester';

describe('Registration', () => {
  it('creates account and lands on dashboard', () => {
    cy.visit('/register');
    cy.get('h1').should('contain.text', 'Protein Tracker');

    cy.get('#displayName').type(displayName);
    cy.get('#email').type(email);
    cy.get('#password').type(password);
    cy.get('button[type="submit"]').click();

    cy.url({ timeout: 8000 }).should('match', /\/dashboard/);
    cy.get('.header-title').should('contain.text', 'Protein Tracker');
  });

  it('shows error for duplicate email', () => {
    cy.visit('/register');
    cy.get('#displayName').type(displayName);
    cy.get('#email').type(email); // same email as above
    cy.get('#password').type(password);
    cy.get('button[type="submit"]').click();

    cy.get('.alert-error', { timeout: 5000 }).should('be.visible');
    cy.get('.alert-error').should('contain.text', 'already exists');
  });

  it('shows validation errors for empty form', () => {
    cy.visit('/register');
    cy.get('button[type="submit"]').click();

    // Touch all fields by tabbing through them
    cy.get('#displayName').focus();
    cy.get('#email').focus();
    cy.get('#password').focus();
    cy.get('button[type="submit"]').focus();

    cy.get('.field-error').first().should('be.visible');
  });
});

describe('Login', () => {
  it('signs in with correct credentials and lands on dashboard', () => {
    cy.visit('/login');
    cy.get('h1').should('contain.text', 'Protein Tracker');

    cy.get('#email').type(email);
    cy.get('#password').type(password);
    cy.get('button[type="submit"]').click();

    cy.url({ timeout: 8000 }).should('match', /\/dashboard/);
  });

  it('shows error for wrong password', () => {
    cy.visit('/login');
    cy.get('#email').type(email);
    cy.get('#password').type('wrongpassword');
    cy.get('button[type="submit"]').click();

    cy.get('.alert-error', { timeout: 5000 }).should('be.visible');
    cy.get('.alert-error').should('contain.text', 'Invalid email or password');
  });

  it('shows error for unknown email', () => {
    cy.visit('/login');
    cy.get('#email').type('nobody@nowhere.com');
    cy.get('#password').type('anypassword');
    cy.get('button[type="submit"]').click();

    cy.get('.alert-error', { timeout: 5000 }).should('be.visible');
    cy.get('.alert-error').should('contain.text', 'Invalid email or password');
  });
});

describe('Logout', () => {
  it('logs out and redirects to login', () => {
    // Login first
    cy.visit('/login');
    cy.get('#email').type(email);
    cy.get('#password').type(password);
    cy.get('button[type="submit"]').click();
    cy.url({ timeout: 8000 }).should('match', /\/dashboard/);

    // Logout
    cy.contains('button', 'Log out').click();
    cy.url({ timeout: 5000 }).should('match', /\/login/);
  });

  it('redirects unauthenticated user to login', () => {
    cy.visit('/dashboard');
    cy.url({ timeout: 5000 }).should('match', /\/login/);
  });
});
