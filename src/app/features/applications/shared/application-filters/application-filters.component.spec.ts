import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { provideComponentTesting } from '../../../../testing/component-test-bed';
import { ApplicationFiltersComponent } from './application-filters.component';
import { FormControl } from '@angular/forms';

describe('ApplicationFiltersComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApplicationFiltersComponent],
      providers: provideComponentTesting(),
    }).compileComponents();
  });

  afterEach(() => TestBed.resetTestingModule());

  it('creates with filter controls', () => {
    const fixture = TestBed.createComponent(ApplicationFiltersComponent);
    fixture.componentRef.setInput('searchControl', new FormControl(''));
    fixture.componentRef.setInput('statusControl', new FormControl(''));
    fixture.componentRef.setInput('statuses', ['DRAFT']);
    fixture.componentRef.setInput('simulatingExpiry', false);
    fixture.componentRef.setInput('activeStatFilter', 'all');
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });
});
