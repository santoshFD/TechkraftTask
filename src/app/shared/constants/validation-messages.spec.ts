import { describe, expect, it } from 'vitest';
import { resolveValidationMessage } from './validation-messages';

describe('resolveValidationMessage', () => {
  const field = (overrides: Partial<{ label: string; name: string; validationMessages: Record<string, string> }> = {}) => ({
    name: 'fullName',
    label: 'Full name',
    ...overrides,
  });

  it('uses label-based required when config is generic', () => {
    expect(
      resolveValidationMessage(
        field({ validationMessages: { required: 'This field is required.' } }),
        'required',
        true,
      ),
    ).toBe('Full name is required.');
  });

  it('uses custom required from config', () => {
    expect(
      resolveValidationMessage(field({ validationMessages: { required: 'Email is required.' } }), 'required', true),
    ).toBe('Email is required.');
  });

  it('supports {label} token in custom messages', () => {
    expect(
      resolveValidationMessage(field({ validationMessages: { required: '{label} must be filled in.' } }), 'required', true),
    ).toBe('Full name must be filled in.');
  });

  it('falls back to defaults for other keys', () => {
    expect(resolveValidationMessage(field(), 'email', true)).toBe('Enter a valid email address.');
  });

  it('replaces {0} from validator payload', () => {
    expect(resolveValidationMessage(field(), 'minlength', { requiredLength: 4 })).toBe('Minimum length is 4.');
  });
});
