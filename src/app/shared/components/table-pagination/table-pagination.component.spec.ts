import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { provideComponentTesting } from '../../../testing/component-test-bed';
import { TablePaginationComponent } from './table-pagination.component';

describe('TablePaginationComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TablePaginationComponent],
      providers: provideComponentTesting(),
    }).compileComponents();
  });

  afterEach(() => TestBed.resetTestingModule());

  it('creates and forwards page events', () => {
    const fixture = TestBed.createComponent(TablePaginationComponent);
    fixture.componentRef.setInput('length', 100);
    fixture.detectChanges();
    const spy = vi.fn();
    fixture.componentInstance.pageChange.subscribe(spy);
    fixture.componentInstance.onPage({ pageIndex: 1, pageSize: 10, length: 100 });
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ pageIndex: 1 }));
  });
});
