import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { provideComponentTesting } from '../../../testing/component-test-bed';
import { ActionButtonComponent } from './action-button.component';

describe('ActionButtonComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActionButtonComponent],
      providers: provideComponentTesting(),
    }).compileComponents();
  });

  afterEach(() => TestBed.resetTestingModule());

  it('creates', () => {
    const fixture = TestBed.createComponent(ActionButtonComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('emits pressed when not loading', () => {
    const fixture = TestBed.createComponent(ActionButtonComponent);
    fixture.detectChanges();
    let clicked = false;
    fixture.componentInstance.pressed.subscribe(() => (clicked = true));
    fixture.componentInstance.onClick(new MouseEvent('click'));
    expect(clicked).toBe(true);
  });

  it('maps flat variant to filled appearance', () => {
    const fixture = TestBed.createComponent(ActionButtonComponent);
    fixture.componentRef.setInput('variant', 'flat');
    expect(fixture.componentInstance.matAppearance()).toBe('filled');
  });
});
