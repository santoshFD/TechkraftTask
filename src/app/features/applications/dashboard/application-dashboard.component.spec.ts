import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { provideComponentTesting } from '../../../testing/component-test-bed';
import { ApplicationDashboardComponent } from './application-dashboard.component';
import { ApplicationApiService } from '../../../core/services/application-api.service';
import { createMockApplicationApiService } from '../../../testing/mock-application-api';
import { AuthService } from '../../../core/auth/auth.service';

describe('ApplicationDashboardComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApplicationDashboardComponent],
      providers: [
        ...provideComponentTesting(),
        { provide: ApplicationApiService, useValue: createMockApplicationApiService() },
        { provide: AuthService, useValue: { role: () => 'SALES', user: () => ({ id: 'u-sales-1' }) } },
      ],
    }).compileComponents();
  });

  afterEach(() => TestBed.resetTestingModule());

  it('creates and exposes canCreate for sales', () => {
    const fixture = TestBed.createComponent(ApplicationDashboardComponent);
    expect(fixture.componentInstance.canCreate()).toBe(true);
  });
});
