import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MerchantApplication } from '../../../core/models/application.model';
import { ApplicationApiService } from '../../../core/services/application-api.service';
import { createApplicationFieldAsyncValidators } from '../../../shared/validators/application-field.validators';
import { formatPhoneInput } from '../../../shared/formatters/phone.format';
import { formatSsnInput } from '../../../shared/formatters/ssn.format';
import { formatTaxIdInput } from '../../../shared/formatters/tax-id.format';
import {
  phoneValidator,
  routingNumberValidator,
  ssnValidator,
  taxIdValidator,
} from '../../../shared/validators/merchant.validators';

export type ApplicationFormGroup = FormGroup;

export interface BuildApplicationFormOptions {
  applicationId: string;
  api: ApplicationApiService;
}

export function buildApplicationForm(
  fb: FormBuilder,
  app?: MerchantApplication,
  options?: BuildApplicationFormOptions,
): ApplicationFormGroup {
  const source = app ?? null;
  const asyncValidators = options
    ? createApplicationFieldAsyncValidators(options.api, options.applicationId)
    : null;

  return fb.group({
    business: fb.group({
      legalName: [
        source?.business.legalName ?? '',
        Validators.required,
        asyncValidators ? [asyncValidators.legalName] : [],
      ],
      dba: [source?.business.dba ?? ''],
      taxId: [
        source?.business.taxId ? formatTaxIdInput(source.business.taxId) : '',
        taxIdValidator,
        asyncValidators ? [asyncValidators.taxId] : [],
      ],
      mcc: [source?.business.mcc ?? '', Validators.required],
      website: [source?.business.website ?? ''],
      monthlyVolume: [source?.business.monthlyVolume ?? null],
    }),
    owner: fb.group({
      fullName: [source?.owner.fullName ?? '', Validators.required],
      email: [source?.owner.email ?? '', [Validators.required, Validators.email]],
      phone: [
        source?.owner.phone ? formatPhoneInput(source.owner.phone) : '',
        [Validators.required, phoneValidator],
      ],
      ownershipPercent: [
        source?.owner.ownershipPercent ?? null,
        [Validators.required, Validators.min(1), Validators.max(100)],
      ],
      ssn: [
        source?.owner.ssn ? formatSsnInput(source.owner.ssn) : '',
        [Validators.required, ssnValidator],
      ],
    }),
    banking: fb.group({
      accountHolder: [source?.banking.accountHolder ?? '', Validators.required],
      routingNumber: [source?.banking.routingNumber ?? '', [Validators.required, routingNumberValidator]],
      accountNumber: [source?.banking.accountNumber ?? '', [Validators.required, Validators.minLength(4)]],
    }),
  });
}

export function formValueToPayload(form: ApplicationFormGroup): Pick<MerchantApplication, 'business' | 'owner' | 'banking'> {
  const raw = form.getRawValue();
  return {
    business: raw.business,
    owner: raw.owner,
    banking: raw.banking,
  };
}
