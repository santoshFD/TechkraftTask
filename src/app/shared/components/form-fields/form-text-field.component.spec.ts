import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { provideComponentTesting } from '../../../testing/component-test-bed';
import { FormTextFieldComponent } from './form-text-field.component';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, FormTextFieldComponent],
  template: `<form [formGroup]="group"><form-text-field controlName="name" label="Name" /></form>`,
})
class FormTextFieldHostComponent {
  readonly group = new FormBuilder().group({ name: [''] }) as FormGroup;
}

describe('FormTextFieldComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormTextFieldHostComponent],
      providers: provideComponentTesting(),
    }).compileComponents();
  });

  afterEach(() => TestBed.resetTestingModule());

  it('creates inside form group', () => {
    const fixture = TestBed.createComponent(FormTextFieldHostComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('mat-form-field')).toBeTruthy();
  });
});
