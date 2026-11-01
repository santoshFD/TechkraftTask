import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { provideComponentTesting } from '../../../testing/component-test-bed';
import { SignupComponent } from './signup.component';
import { AuthService } from '../../../core/auth/auth.service';
import { of } from 'rxjs';

describe('SignupComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SignupComponent],
      providers: [
        ...provideComponentTesting(),
        {
          provide: AuthService,
          useValue: {
            register: () => of({ id: 'u1', email: 'a@b.c', displayName: 'A', role: 'SALES' }),
          },
        },
      ],
    }).compileComponents();
  });

  afterEach(() => TestBed.resetTestingModule());

  it('creates signup form', () => {
    const fixture = TestBed.createComponent(SignupComponent);
    expect(fixture.componentInstance.form.get('email')).toBeTruthy();
  });
});
