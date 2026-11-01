import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { provideComponentTesting } from '../../testing/component-test-bed';
import { AppRbacDirective } from './app-rbac.directive';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  standalone: true,
  imports: [AppRbacDirective],
  template: `
    <ng-container
      *appRbac="'applications.editDraft'; context: { status: 'DRAFT', createdByUserId: 'u-sales-1' }"
    >
      <span data-testid="edit">edit</span>
    </ng-container>
  `,
})
class AppRbacHostComponent {}

describe('AppRbacDirective', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppRbacHostComponent],
      providers: [
        ...provideComponentTesting(),
        {
          provide: AuthService,
          useValue: {
            role: () => 'SALES' as const,
            user: () => ({ id: 'u-sales-1' }),
          },
        },
      ],
    }).compileComponents();
  });

  afterEach(() => TestBed.resetTestingModule());

  it('shows content when permission passes', () => {
    const fixture = TestBed.createComponent(AppRbacHostComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-testid="edit"]')?.textContent).toBe('edit');
  });
});
