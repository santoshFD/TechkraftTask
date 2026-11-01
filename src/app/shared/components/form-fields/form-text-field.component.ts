import { Component, HostBinding, inject, input } from '@angular/core';
import { ControlContainer, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { PhoneMaskDirective } from '../../directives/phone-mask.directive';
import { SsnMaskDirective } from '../../directives/ssn-mask.directive';
import { TaxIdMaskDirective } from '../../directives/tax-id-mask.directive';
import { FormFieldErrorConfig, FormFieldMask } from './form-field.model';

@Component({
  selector: 'form-text-field',
  standalone: true,
  viewProviders: [
    {
      provide: ControlContainer,
      useFactory: () => inject(ControlContainer, { skipSelf: true }),
    },
  ],
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    TaxIdMaskDirective,
    PhoneMaskDirective,
    SsnMaskDirective,
  ],
  templateUrl: './form-text-field.component.html',
  styleUrl: './form-text-field.component.scss',
})
export class FormTextFieldComponent {
  private readonly controlContainer = inject(ControlContainer);

  readonly label = input.required<string>();
  readonly controlName = input.required<string>();
  /** Optional layout class on host (e.g. `application-form-grid--span-full`). */
  readonly colClass = input('col-12 col-md-6');

  @HostBinding('class')
  get hostClasses(): string {
    return ['app-form-field-host', this.colClass()].filter(Boolean).join(' ');
  }
  readonly mask = input<FormFieldMask | null>(null);
  readonly errors = input<FormFieldErrorConfig[]>([]);
  readonly inputType = input('text');
  readonly inputMode = input<string | undefined>(undefined);
  readonly maxLength = input<number | undefined>(undefined);
  readonly placeholder = input('');
  readonly autocomplete = input<string | undefined>(undefined);

  showError(err: FormFieldErrorConfig): boolean {
    const control = this.controlContainer.control?.get(this.controlName());
    if (!control?.hasError(err.key)) {
      return false;
    }
    if (err.when === 'always') {
      return true;
    }
    return control.touched || control.dirty;
  }
}
