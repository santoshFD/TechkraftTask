import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { provideComponentTesting } from '../../../testing/component-test-bed';
import { SensitiveFieldComponent } from './sensitive-field.component';
import { AuthService } from '../../../core/auth/auth.service';

describe('SensitiveFieldComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SensitiveFieldComponent],
      providers: [
        ...provideComponentTesting(),
        { provide: AuthService, useValue: { hasRole: () => false } },
      ],
    }).compileComponents();
  });

  afterEach(() => TestBed.resetTestingModule());

  it('masks value by default', () => {
    const fixture = TestBed.createComponent(SensitiveFieldComponent);
    fixture.componentRef.setInput('value', '1234567890');
    fixture.componentRef.setInput('label', 'SSN');
    fixture.detectChanges();
    expect(fixture.componentInstance.displayValue()).toMatch(/\*+7890$/);
  });
});
