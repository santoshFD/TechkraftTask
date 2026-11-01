import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, map, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginResponse, User, UserRole } from '../models/user.model';
import { TokenStorageService } from './token-storage.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly tokens = inject(TokenStorageService);
  private readonly router = inject(Router);

  private readonly userSignal = signal<User | null>(null);

  readonly user = this.userSignal.asReadonly();
  readonly isAuthenticated = computed(() => this.userSignal() !== null);
  readonly role = computed(() => this.userSignal()?.role ?? null);

  restoreSessionFromStorage(): void {
    const token = this.tokens.getAccessToken();
    if (!token?.startsWith('mock-access.')) {
      return;
    }
    try {
      const payload = JSON.parse(atob(token.slice('mock-access.'.length))) as {
        sub: string;
        role: UserRole;
        exp: number;
        email?: string;
        displayName?: string;
      };
      if (payload.exp <= Date.now()) {
        this.tokens.clear();
        return;
      }
      this.userSignal.set(this.userFromClaims(payload));
    } catch {
      this.tokens.clear();
    }
  }

  register(input: {
    displayName: string;
    email: string;
    password: string;
  }): Observable<User> {
    return this.http
      .post<LoginResponse>(`${environment.apiBaseUrl}/auth/register`, input)
      .pipe(
        tap((res) => {
          this.tokens.setTokens(res.accessToken, res.refreshToken);
          this.userSignal.set(res.user);
        }),
        map((res) => res.user),
      );
  }

  login(email: string, password: string): Observable<User> {
    return this.http
      .post<LoginResponse>(`${environment.apiBaseUrl}/auth/login`, { email, password })
      .pipe(
        tap((res) => {
          this.tokens.setTokens(res.accessToken, res.refreshToken);
          this.userSignal.set(res.user);
        }),
        map((res) => res.user),
      );
  }

  refreshAccessToken(): Observable<string> {
    const refreshToken = this.tokens.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token');
    }
    return this.http
      .post<LoginResponse>(`${environment.apiBaseUrl}/auth/refresh`, { refreshToken })
      .pipe(
        tap((res) => {
          this.tokens.setTokens(res.accessToken, res.refreshToken);
          if (res.user) {
            this.userSignal.set(res.user);
          }
        }),
        map((res) => res.accessToken),
      );
  }

  logout(): void {
    this.tokens.clear();
    this.userSignal.set(null);
    void this.router.navigate(['/login']);
  }

  hasRole(...roles: UserRole[]): boolean {
    const current = this.role();
    return current !== null && roles.includes(current);
  }

  private userFromClaims(payload: {
    sub: string;
    role: UserRole;
    email?: string;
    displayName?: string;
  }): User {
    const catalog: Record<string, Partial<User>> = {
      'u-sales-1': { email: 'sales@merchant.test', displayName: 'Sara Sales' },
      'u-reviewer-1': { email: 'reviewer@merchant.test', displayName: 'Ravi Reviewer' },
      'u-admin-1': { email: 'admin@merchant.test', displayName: 'Asha Admin' },
    };
    if (payload.email && payload.displayName) {
      return {
        id: payload.sub,
        role: payload.role,
        email: payload.email,
        displayName: payload.displayName,
      };
    }
    const meta = catalog[payload.sub] ?? { email: 'user@merchant.test', displayName: 'User' };
    return {
      id: payload.sub,
      role: payload.role,
      email: meta.email!,
      displayName: meta.displayName!,
    };
  }
}
