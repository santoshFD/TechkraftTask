import { FormBuilder } from '@angular/forms';
import { describe, expect, it } from 'vitest';
import { getWizardStepErrorSummaries } from './wizard-step-errors.util';

describe('getWizardStepErrorSummaries', () => {
  it('lists invalid fields by step', () => {
    const fb = new FormBuilder();
    const form = fb.group({
      business: fb.group({ legalName: ['', []], mcc: [''] }),
      owner: fb.group({ email: ['bad', []] }),
      banking: fb.group({ accountHolder: ['ok'] }),
    });
    form.get('business.legalName')?.setErrors({ required: true });
    form.get('owner.email')?.setErrors({ email: true });

    const summaries = getWizardStepErrorSummaries(form);
    expect(summaries).toHaveLength(2);
    expect(summaries[0].step).toBe('business');
    expect(summaries[0].messages[0]).toContain('Legal name');
  });
});
