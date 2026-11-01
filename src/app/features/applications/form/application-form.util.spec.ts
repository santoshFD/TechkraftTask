import { FormBuilder } from '@angular/forms';
import { describe, expect, it } from 'vitest';
import { buildApplicationForm, formValueToPayload } from './application-form.util';

describe('application-form.util', () => {
  it('builds nested merchant form groups', () => {
    const fb = new FormBuilder();
    const form = buildApplicationForm(fb);
    expect(form.get('business.legalName')).toBeTruthy();
    expect(form.get('owner.email')).toBeTruthy();
    expect(form.get('banking.routingNumber')).toBeTruthy();
  });

  it('maps form value to API payload shape', () => {
    const fb = new FormBuilder();
    const form = buildApplicationForm(fb);
    form.patchValue({
      business: { legalName: 'Acme LLC', dba: '', taxId: '', mcc: '1234', website: '', monthlyVolume: null },
      owner: {
        fullName: 'Pat',
        email: 'pat@example.com',
        phone: '(555) 123-4567',
        ownershipPercent: 100,
        ssn: '123-45-6789',
      },
      banking: { accountHolder: 'Acme', routingNumber: '021000021', accountNumber: '1234' },
    });
    const payload = formValueToPayload(form);
    expect(payload.business.legalName).toBe('Acme LLC');
    expect(payload.owner.email).toBe('pat@example.com');
  });
});
