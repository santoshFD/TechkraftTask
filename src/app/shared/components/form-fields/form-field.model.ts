export type FormFieldMask = 'taxId' | 'phone' | 'ssn';

export interface FormFieldErrorConfig {
  key: string;
  message: string;
  /** When to show the message. `always` is used for async errors like duplicates. */
  when?: 'touched' | 'always';
}

/** Declarative wizard field — rendered by `app-application-form-section-fields`. */
export interface ApplicationFormFieldConfig {
  controlName: string;
  label: string;
  colClass?: string;
  mask?: FormFieldMask;
  inputType?: string;
  inputMode?: string;
  maxLength?: number;
  placeholder?: string;
  autocomplete?: string;
  errors?: FormFieldErrorConfig[];
}
