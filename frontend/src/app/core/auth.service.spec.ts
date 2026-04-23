import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;

  const mockResponse = {
    token: 'test-token',
    userId: 'user-123',
    email: 'test@example.com',
    displayName: 'Test User'
  };

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule]
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  it('should start unauthenticated', () => {
    expect(service.isAuthenticated()).toBeFalse();
    expect(service.currentUser()).toBeNull();
  });

  it('login() stores token and sets currentUser', () => {
    service.login('test@example.com', 'password123').subscribe();

    const req = http.expectOne(`${environment.apiUrl}/auth/login`);
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);

    expect(service.isAuthenticated()).toBeTrue();
    expect(service.currentUser()?.email).toBe('test@example.com');
    expect(localStorage.getItem('pt_token')).toBe('test-token');
  });

  it('register() stores token and sets currentUser', () => {
    service.register('test@example.com', 'password123', 'Test User').subscribe();

    const req = http.expectOne(`${environment.apiUrl}/auth/register`);
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);

    expect(service.isAuthenticated()).toBeTrue();
    expect(service.currentUser()?.displayName).toBe('Test User');
  });

  it('logout() clears token and currentUser', () => {
    service.login('test@example.com', 'password123').subscribe();
    http.expectOne(`${environment.apiUrl}/auth/login`).flush(mockResponse);

    service.logout();

    expect(service.isAuthenticated()).toBeFalse();
    expect(service.currentUser()).toBeNull();
    expect(localStorage.getItem('pt_token')).toBeNull();
  });

  it('getToken() returns stored token', () => {
    service.login('test@example.com', 'password123').subscribe();
    http.expectOne(`${environment.apiUrl}/auth/login`).flush(mockResponse);

    expect(service.getToken()).toBe('test-token');
  });

  it('persists user across service instantiation', () => {
    service.login('test@example.com', 'password123').subscribe();
    http.expectOne(`${environment.apiUrl}/auth/login`).flush(mockResponse);

    // Simulate page reload — new service instance reads from localStorage
    const newService = new AuthService(
      TestBed.inject(require('@angular/common/http').HttpClient),
      TestBed.inject(require('@angular/router').Router)
    );
    expect(newService.isAuthenticated()).toBeTrue();
  });
});
