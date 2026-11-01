import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { DynamicFormComponent } from '../../../shared/components/dynamic-form/dynamic-form.component';
import {
  MERCHANT_APPLICATION_DYNAMIC_FORMS,
  MerchantApplicationFormSection,
} from './application-merchant-dynamic-form.config';

export type ApplicationFormSection = MerchantApplicationFormSection;

/**
 * Renders merchant application form sections from dynamic form config (no stepper).
 */
@Component({
  selector: 'application-form-builder',
  standalone: true,
  imports: [ReactiveFormsModule, DynamicFormComponent],
  templateUrl: './application-form-builder.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApplicationFormBuilderComponent {
  readonly section = input.required<ApplicationFormSection>();
  readonly stepForm = input.required<FormGroup>();
  readonly showValidation = input(false);

  protected readonly config = computed(() => MERCHANT_APPLICATION_DYNAMIC_FORMS[this.section()]);
}
