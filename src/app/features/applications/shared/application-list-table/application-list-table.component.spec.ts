import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { provideComponentTesting } from '../../../../testing/component-test-bed';
import { ApplicationListTableComponent } from './application-list-table.component';

describe('ApplicationListTableComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApplicationListTableComponent],
      providers: provideComponentTesting(),
    }).compileComponents();
  });

  afterEach(() => TestBed.resetTestingModule());

  it('creates and computes sales columns', () => {
    const fixture = TestBed.createComponent(ApplicationListTableComponent);
    fixture.componentRef.setInput('items', []);
    fixture.componentRef.setInput('total', 0);
    fixture.componentRef.setInput('listViewRole', 'sales');
    fixture.detectChanges();
    expect(fixture.componentInstance.displayedColumns()).toContain('assignedReviewerName');
  });
});
