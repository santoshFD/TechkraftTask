import { AbstractControl, FormGroup } from '@angular/forms';
import { DEFAULT_VALIDATION_MESSAGES } from '../../../shared/constants/validation-messages';
import { ApplicationFormGroup } from './application-form.util';
import { merchantSectionFieldLabels } from './application-merchant-dynamic-form.config';

export type WizardFormStep = 'business' | 'owner' | 'banking';

export const WIZARD_STEP_INCOMPLETE_LABEL = 'Incomplete Details';

export interface WizardStepErrorSummary {
  step: WizardFormStep;
  label: string;
  messages: string[];
}

const STEP_META: { step: WizardFormStep; label: string }[] = [
  { step: 'business', label: 'Business' },
  { step: 'owner', label: 'Owner' },
  { step: 'banking', label: 'Banking' },
];

function messageForKey(key: string, err: unknown): string {
  let msg = DEFAULT_VALIDATION_MESSAGES[key] ?? 'Invalid value.';
  if (msg.includes('{0}') && typeof err === 'object' && err !== null) {
    const o = err as { requiredLength?: number; min?: number; max?: number };
    msg = msg.replace('{0}', String(o.requiredLength ?? o.min ?? o.max ?? ''));
  }
  return msg;
}

function messagesForControl(step: WizardFormStep, controlName: string, control: AbstractControl): string[] {
  if (!control.errors) {
    return [];
  }
  const labels = merchantSectionFieldLabels(step);
  const fieldLabel = labels[controlName] ?? controlName;
  return Object.keys(control.errors).map((key) => {
    const detail = messageForKey(key, control.errors![key]);
    return `${fieldLabel}: ${detail}`;
  });
}

function collectStepMessages(step: WizardFormStep, group: FormGroup): string[] {
  const messages: string[] = [];
  for (const key of Object.keys(group.controls)) {
    const control = group.get(key);
    if (!control) {
      continue;
    }
    messages.push(...messagesForControl(step, key, control));
  }
  return messages;
}

/** First validation message for a step (text only, for stepper header). */
export function getWizardStepPrimaryErrorMessage(
  form: ApplicationFormGroup,
  step: WizardFormStep,
): string | null {
  const summary = getWizardStepErrorSummaries(form).find((item) => item.step === step);
  if (!summary?.messages.length) {
    return null;
  }
  const first = summary.messages[0];
  const separator = first.indexOf(': ');
  return separator >= 0 ? first.slice(separator + 2) : first;
}

export function getWizardStepErrorSummaries(form: ApplicationFormGroup): WizardStepErrorSummary[] {
  const summaries: WizardStepErrorSummary[] = [];

  for (const { step, label } of STEP_META) {
    const group = form.get(step);
    if (!(group instanceof FormGroup) || group.valid) {
      continue;
    }
    const messages = collectStepMessages(step, group);
    if (messages.length > 0) {
      summaries.push({ step, label, messages });
    }
  }

  return summaries;
}

export const WIZARD_STEP_INDEX: Record<WizardFormStep, number> = {
  business: 0,
  owner: 1,
  banking: 2,
};
