import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthResponse, AuthUser, UserResponse } from './models/auth.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'pt_token';
  private readonly USER_KEY = 'pt_user';

  private _currentUser = signal<AuthUser | null>(this.loadUser());
  readonly currentUser = this._currentUser.asReadonly();
  readonly isAuthenticated = computed(() => this._currentUser() !== null);

  constructor(private http: HttpClient, private router: Router) {}

  register(email: string, password: string, displayName: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/register`, { email, password, displayName })
      .pipe(tap(res => this.storeSession(res)));
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/login`, { email, password })
      .pipe(tap(res => this.storeSession(res)));
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this._currentUser.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  updateGoal(goalGrams: number): Observable<UserResponse> {
    return this.http
      .patch<UserResponse>(`${environment.apiUrl}/auth/goal`, { goalGrams })
      .pipe(tap(res => {
        const user = this._currentUser();
        if (user) {
          const updated = { ...user, dailyGoalGrams: res.dailyGoalGrams };
          localStorage.setItem(this.USER_KEY, JSON.stringify(updated));
          this._currentUser.set(updated);
        }
      }));
  }

  private storeSession(res: AuthResponse): void {
    localStorage.setItem(this.TOKEN_KEY, res.token);
    const user: AuthUser = {
      userId: res.userId,
      email: res.email,
      displayName: res.displayName,
      dailyGoalGrams: res.dailyGoalGrams ?? 150,
    };
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this._currentUser.set(user);
  }

  private loadUser(): AuthUser | null {
    try {
      const raw = localStorage.getItem(this.USER_KEY);
      const user = raw ? JSON.parse(raw) : null;
      if (user && user.dailyGoalGrams === undefined) user.dailyGoalGrams = 150;
      return user;
    } catch {
      return null;
    }
  }
}
