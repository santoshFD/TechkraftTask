import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { authGuard } from './auth.guard';
import { AuthService } from '../auth/auth.service';
import { provideZonelessChangeDetection } from '@angular/core';

describe('authGuard', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        {
          provide: AuthService,
          useValue: { isAuthenticated: () => false },
        },
      ],
    });
  });

  afterEach(() => TestBed.resetTestingModule());

  it('allows authenticated users', () => {
    TestBed.overrideProvider(AuthService, { useValue: { isAuthenticated: () => true } });
    const result = TestBed.runInInjectionContext(() => authGuard(null!, null!));
    expect(result).toBe(true);
  });

  it('redirects unauthenticated users to login', () => {
    const result = TestBed.runInInjectionContext(() => authGuard(null!, null!));
    expect(result).toEqual(TestBed.inject(Router).createUrlTree(['/login']));
  });
});
