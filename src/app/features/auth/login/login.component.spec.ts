import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { provideComponentTesting } from '../../../testing/component-test-bed';
import { LoginComponent } from './login.component';
import { AuthService } from '../../../core/auth/auth.service';
import { of } from 'rxjs';

describe('LoginComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        ...provideComponentTesting(),
        {
          provide: AuthService,
          useValue: {
            login: () => of({ id: 'u1', email: 'a@b.c', displayName: 'A', role: 'SALES' }),
          },
        },
      ],
    }).compileComponents();
  });

  afterEach(() => TestBed.resetTestingModule());

  it('creates login form', () => {
    const fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.form).toBeTruthy();
  });
});
