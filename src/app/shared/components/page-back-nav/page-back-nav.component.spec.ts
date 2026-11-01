import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { provideComponentTesting } from '../../../testing/component-test-bed';
import { PageBackNavComponent } from './page-back-nav.component';

describe('PageBackNavComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PageBackNavComponent],
      providers: provideComponentTesting(),
    }).compileComponents();
  });

  afterEach(() => TestBed.resetTestingModule());

  it('creates with link input', () => {
    const fixture = TestBed.createComponent(PageBackNavComponent);
    fixture.componentRef.setInput('link', ['/applications']);
    fixture.detectChanges();
    expect(fixture.componentInstance.label()).toBe('Back');
  });
});
