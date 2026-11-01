import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { provideComponentTesting } from '../../../testing/component-test-bed';
import { ApplicationFormBuilderComponent } from './application-form-builder.component';
import { MERCHANT_BUSINESS_FORM } from './application-merchant-dynamic-form.config';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, ApplicationFormBuilderComponent],
  template: `<application-form-builder section="business" [stepForm]="stepForm" />`,
})
class FormBuilderHostComponent {
  readonly stepForm = new FormBuilder().group({
    legalName: [''],
    dba: [''],
    taxId: [''],
    mcc: [''],
    website: [''],
    monthlyVolume: [null],
  }) as FormGroup;
}

describe('ApplicationFormBuilderComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormBuilderHostComponent],
      providers: provideComponentTesting(),
    }).compileComponents();
  });

  afterEach(() => TestBed.resetTestingModule());

  it('loads business section config', () => {
    const fixture = TestBed.createComponent(FormBuilderHostComponent);
    fixture.detectChanges();
    expect(MERCHANT_BUSINESS_FORM.formId).toBe('merchant-business');
  });
});
