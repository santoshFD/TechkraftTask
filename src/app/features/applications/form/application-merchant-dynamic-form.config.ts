import { DynamicFormConfig } from '../../../shared/models/dynamic-form.model';

export type MerchantApplicationFormSection = 'business' | 'owner' | 'banking';

const LEGAL_NAME_MESSAGES = {
  required: 'Legal name is required.',
  legalNameDuplicate: 'This legal name is already used by another application.',
};

const TAX_ID_MESSAGES = {
  taxId: 'Use EIN format XX-XXXXXXX.',
  taxIdDuplicate: 'This tax ID is already used by another application.',
};

const EMAIL_MESSAGES = {
  required: 'Email is required.',
  email: 'Enter a valid email address.',
};

const PHONE_MESSAGES = {
  required: 'Phone is required.',
  phone: 'Use format (XXX) XXX-XXXX.',
};

const SSN_MESSAGES = {
  required: 'SSN is required.',
  ssn: 'Use format XXX-XX-XXXX.',
};

const ROUTING_MESSAGES = {
  required: 'Routing number is required.',
  routingNumber: 'Routing number must be 9 digits.',
};

const REQUIRED = { required: 'This field is required.' } as const;

export const MERCHANT_BUSINESS_FORM: DynamicFormConfig = {
  formId: 'merchant-business',
  layout: 'grid',
  sections: [
    {
      id: 'business',
      layout: 'grid',
      fields: [
        {
          id: 'legalName',
          name: 'legalName',
          type: 'text',
          label: 'Legal name',
          halfWidth: true,
          isRequired: true,
          autocomplete: 'organization',
          validationMessages: LEGAL_NAME_MESSAGES,
        },
        { id: 'dba', name: 'dba', type: 'text', label: 'DBA', halfWidth: true },
        {
          id: 'taxId',
          name: 'taxId',
          type: 'text',
          label: 'Tax ID (EIN)',
          halfWidth: true,
          mask: 'taxId',
          maxLength: 10,
          placeholder: '12-3456789',
          autocomplete: 'off',
          validationMessages: TAX_ID_MESSAGES,
        },
        { id: 'mcc', name: 'mcc', type: 'text', label: 'MCC', halfWidth: true, isRequired: true, validationMessages: REQUIRED },
        { id: 'website', name: 'website', type: 'url', label: 'Website', halfWidth: true },
        {
          id: 'monthlyVolume',
          name: 'monthlyVolume',
          type: 'number',
          label: 'Monthly volume (USD)',
          halfWidth: true,
          inputMode: 'decimal',
        },
      ],
    },
  ],
};

export const MERCHANT_OWNER_FORM: DynamicFormConfig = {
  formId: 'merchant-owner',
  layout: 'grid',
  sections: [
    {
      id: 'owner',
      layout: 'grid',
      fields: [
        {
          id: 'fullName',
          name: 'fullName',
          type: 'text',
          label: 'Full name',
          halfWidth: true,
          isRequired: true,
          autocomplete: 'name',
          validationMessages: REQUIRED,
        },
        {
          id: 'email',
          name: 'email',
          type: 'email',
          label: 'Email',
          halfWidth: true,
          isRequired: true,
          autocomplete: 'email',
          validationMessages: EMAIL_MESSAGES,
        },
        {
          id: 'phone',
          name: 'phone',
          type: 'tel',
          label: 'Phone',
          halfWidth: true,
          isRequired: true,
          mask: 'phone',
          maxLength: 14,
          placeholder: '(555) 123-4567',
          autocomplete: 'tel',
          validationMessages: PHONE_MESSAGES,
        },
        {
          id: 'ownershipPercent',
          name: 'ownershipPercent',
          type: 'number',
          label: 'Ownership %',
          halfWidth: true,
          isRequired: true,
          inputMode: 'decimal',
          min: 1,
          max: 100,
          validationMessages: { ...REQUIRED, min: 'Minimum value is 1.', max: 'Maximum value is 100.' },
        },
        {
          id: 'ssn',
          name: 'ssn',
          type: 'text',
          label: 'SSN',
          fullWidth: true,
          isRequired: true,
          mask: 'ssn',
          maxLength: 11,
          placeholder: '123-45-6789',
          autocomplete: 'off',
          validationMessages: SSN_MESSAGES,
        },
      ],
    },
  ],
};

export const MERCHANT_BANKING_FORM: DynamicFormConfig = {
  formId: 'merchant-banking',
  layout: 'grid',
  sections: [
    {
      id: 'banking',
      layout: 'grid',
      fields: [
        {
          id: 'accountHolder',
          name: 'accountHolder',
          type: 'text',
          label: 'Account holder',
          halfWidth: true,
          isRequired: true,
          autocomplete: 'name',
          validationMessages: REQUIRED,
        },
        {
          id: 'routingNumber',
          name: 'routingNumber',
          type: 'text',
          label: 'Routing number',
          halfWidth: true,
          isRequired: true,
          inputMode: 'numeric',
          autocomplete: 'off',
          validationMessages: ROUTING_MESSAGES,
        },
        {
          id: 'accountNumber',
          name: 'accountNumber',
          type: 'text',
          label: 'Account number',
          fullWidth: true,
          isRequired: true,
          autocomplete: 'off',
          minLength: 4,
          validationMessages: { ...REQUIRED, minlength: 'Minimum length is 4.' },
        },
      ],
    },
  ],
};

export const MERCHANT_APPLICATION_DYNAMIC_FORMS: Record<MerchantApplicationFormSection, DynamicFormConfig> = {
  business: MERCHANT_BUSINESS_FORM,
  owner: MERCHANT_OWNER_FORM,
  banking: MERCHANT_BANKING_FORM,
};

export function merchantSectionFieldLabels(section: MerchantApplicationFormSection): Record<string, string> {
  const labels: Record<string, string> = {};
  for (const field of MERCHANT_APPLICATION_DYNAMIC_FORMS[section].sections[0].fields) {
    labels[field.name] = field.label ?? field.name;
  }
  return labels;
}
