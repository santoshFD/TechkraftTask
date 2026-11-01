import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { of } from 'rxjs';
import { provideComponentTesting } from '../../../testing/component-test-bed';
import { ApplicationDetailComponent } from './application-detail.component';
import { ApplicationApiService } from '../../../core/services/application-api.service';
import { createMockApplicationApiService } from '../../../testing/mock-application-api';
import { AuthService } from '../../../core/auth/auth.service';

describe('ApplicationDetailComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApplicationDetailComponent],
      providers: [
        ...provideComponentTesting(),
        { provide: ApplicationApiService, useValue: createMockApplicationApiService() },
        {
          provide: AuthService,
          useValue: { role: () => 'SALES', user: () => ({ id: 'u-sales-1' }), hasRole: () => false },
        },
        {
          provide: ActivatedRoute,
          useValue: { paramMap: of(convertToParamMap({ id: 'app-1001' })) },
        },
      ],
    }).compileComponents();
  });

  afterEach(() => TestBed.resetTestingModule());

  it('creates', () => {
    const fixture = TestBed.createComponent(ApplicationDetailComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
