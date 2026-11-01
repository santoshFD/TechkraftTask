import { describe, expect, it } from 'vitest';
import { hasMeaningfulDraftInput, isListableDraftApplication } from './draft-input.util';
import { MerchantApplication } from '../../../core/models/application.model';

describe('draft-input.util', () => {
  it('returns false for empty merchant payload', () => {
    expect(
      hasMeaningfulDraftInput({
        business: { legalName: '', dba: '', taxId: '', mcc: '', website: '', monthlyVolume: null },
        owner: {
          fullName: '',
          email: '',
          phone: '',
          ownershipPercent: null,
          ssn: '',
        },
        banking: { accountHolder: '', routingNumber: '', accountNumber: '' },
      }),
    ).toBe(false);
  });

  it('returns true when any field has content', () => {
    expect(
      hasMeaningfulDraftInput({
        business: { legalName: 'Acme', dba: '', taxId: '', mcc: '', website: '', monthlyVolume: null },
        owner: {
          fullName: '',
          email: '',
          phone: '',
          ownershipPercent: null,
          ssn: '',
        },
        banking: { accountHolder: '', routingNumber: '', accountNumber: '' },
      }),
    ).toBe(true);
  });

  it('hides empty drafts from list eligibility', () => {
    const emptyDraft = {
      status: 'DRAFT',
      business: { legalName: '' },
    } as MerchantApplication;
    expect(isListableDraftApplication(emptyDraft)).toBe(false);
  });
});
