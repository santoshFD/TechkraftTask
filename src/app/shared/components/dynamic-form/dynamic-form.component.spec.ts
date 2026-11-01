import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { provideComponentTesting } from '../../../testing/component-test-bed';
import { DynamicFormComponent } from './dynamic-form.component';
import { MERCHANT_BUSINESS_FORM } from '../../../features/applications/form/application-merchant-dynamic-form.config';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, DynamicFormComponent],
  template: `<form [formGroup]="group"><dynamic-form [config]="config" /></form>`,
})
class DynamicFormHostComponent {
  readonly group = new FormBuilder().group({
    legalName: [''],
    dba: [''],
    taxId: [''],
    mcc: [''],
    website: [''],
    monthlyVolume: [null],
  }) as FormGroup;
  readonly config = MERCHANT_BUSINESS_FORM;
}

describe('DynamicFormComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DynamicFormHostComponent],
      providers: provideComponentTesting(),
    }).compileComponents();
  });

  afterEach(() => TestBed.resetTestingModule());

  it('creates with dynamic form host', () => {
    const fixture = TestBed.createComponent(DynamicFormHostComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('dynamic-form')).toBeTruthy();
  });
});
