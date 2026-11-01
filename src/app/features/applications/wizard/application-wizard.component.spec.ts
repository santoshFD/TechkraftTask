import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { of } from 'rxjs';
import { provideComponentTesting } from '../../../testing/component-test-bed';
import { ApplicationWizardComponent } from './application-wizard.component';
import { ApplicationApiService } from '../../../core/services/application-api.service';
import { createMockApplicationApiService } from '../../../testing/mock-application-api';

describe('ApplicationWizardComponent', () => {
  beforeEach(async () => {
    const api = createMockApplicationApiService();
    await TestBed.configureTestingModule({
      imports: [ApplicationWizardComponent],
      providers: [
        ...provideComponentTesting(),
        { provide: ApplicationApiService, useValue: api },
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(convertToParamMap({ id: 'app-test' })),
          },
        },
      ],
    }).compileComponents();
  });

  afterEach(() => TestBed.resetTestingModule());

  it('creates', () => {
    const fixture = TestBed.createComponent(ApplicationWizardComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
