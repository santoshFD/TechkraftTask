export const DEFAULT_VALIDATION_MESSAGES: Record<string, string> = {
  required: 'This field is required.',
  email: 'Enter a valid email address.',
  minlength: 'Minimum length is {0}.',
  maxlength: 'Maximum length is {0}.',
  min: 'Minimum value is {0}.',
  max: 'Maximum value is {0}.',
  pattern: 'Invalid format.',
  taxId: 'Use EIN format XX-XXXXXXX.',
  phone: 'Use format (XXX) XXX-XXXX.',
  ssn: 'Use format XXX-XX-XXXX.',
  routingNumber: 'Routing number must be 9 digits.',
  legalNameDuplicate: 'This legal name is already used by another application.',
  taxIdDuplicate: 'This tax ID is already used by another application.',
};

const GENERIC_REQUIRED_MESSAGES = new Set([
  DEFAULT_VALIDATION_MESSAGES['required'],
  'This field is required.',
  'This field is required',
]);

export interface ValidationMessageField {
  label?: string;
  name: string;
  validationMessages?: Record<string, string>;
}

function fieldLabel(field: ValidationMessageField): string {
  return (field.label ?? field.name).trim();
}

function applyMessageTokens(message: string, field: ValidationMessageField, err: unknown): string {
  let msg = message.replace(/\{label\}/gi, fieldLabel(field));
  if (msg.includes('{0}') && typeof err === 'object' && err !== null) {
    const o = err as { requiredLength?: number; min?: number; max?: number };
    msg = msg.replace('{0}', String(o.requiredLength ?? o.min ?? o.max ?? ''));
  }
  return msg;
}

/** Config overrides win; generic required falls back to "{Label} is required." */
export function resolveValidationMessage(
  field: ValidationMessageField,
  errorKey: string,
  err: unknown,
): string {
  const custom = field.validationMessages?.[errorKey];

  if (errorKey === 'required') {
    if (custom && !GENERIC_REQUIRED_MESSAGES.has(custom.trim())) {
      return applyMessageTokens(custom, field, err);
    }
    return `${fieldLabel(field)} is required.`;
  }

  if (custom) {
    return applyMessageTokens(custom, field, err);
  }

  const fallback = DEFAULT_VALIDATION_MESSAGES[errorKey] ?? 'Invalid value.';
  return applyMessageTokens(fallback, field, err);
}
