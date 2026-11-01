import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { roleGuard } from './role.guard';
import { AuthService } from '../auth/auth.service';
import { provideZonelessChangeDetection } from '@angular/core';

describe('roleGuard', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideRouter([]), AuthService],
    });
  });

  afterEach(() => TestBed.resetTestingModule());

  it('allows when user has one of the roles', () => {
    const auth = TestBed.inject(AuthService);
    vi.spyOn(auth, 'hasRole').mockImplementation((...roles) => roles.includes('SALES'));
    const guard = roleGuard(['SALES', 'ADMIN']);
    expect(TestBed.runInInjectionContext(() => guard(null!, null!))).toBe(true);
  });

  it('redirects when role not allowed', () => {
    const auth = TestBed.inject(AuthService);
    vi.spyOn(auth, 'hasRole').mockReturnValue(false);
    const guard = roleGuard(['SALES']);
    expect(TestBed.runInInjectionContext(() => guard(null!, null!))).toEqual(
      TestBed.inject(Router).createUrlTree(['/applications']),
    );
  });
});
