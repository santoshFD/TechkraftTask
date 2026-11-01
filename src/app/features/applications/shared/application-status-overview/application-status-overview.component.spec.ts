import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { provideComponentTesting } from '../../../../testing/component-test-bed';
import { ApplicationStatusOverviewComponent } from './application-status-overview.component';

describe('ApplicationStatusOverviewComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApplicationStatusOverviewComponent],
      providers: provideComponentTesting(),
    }).compileComponents();
  });

  afterEach(() => TestBed.resetTestingModule());

  it('creates with stats input', () => {
    const fixture = TestBed.createComponent(ApplicationStatusOverviewComponent);
    fixture.componentRef.setInput('stats', {
      total: 1,
      draft: 1,
      submitted: 0,
      inReview: 0,
      approved: 0,
      rejected: 0,
    });
    fixture.componentRef.setInput('activeFilter', 'all');
    fixture.componentRef.setInput('viewRole', 'sales');
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });
});
