import { MerchantApplication } from '../../../core/models/application.model';

export type DraftFormPayload = Pick<MerchantApplication, 'business' | 'owner' | 'banking'>;

function hasText(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

/** True when the user entered at least one merchant field (draft may be persisted / listed). */
export function hasMeaningfulDraftInput(payload: DraftFormPayload): boolean {
  const business = payload.business ?? ({} as DraftFormPayload['business']);
  const owner = payload.owner ?? ({} as DraftFormPayload['owner']);
  const banking = payload.banking ?? ({} as DraftFormPayload['banking']);
  return (
    hasText(business.legalName) ||
    hasText(business.dba) ||
    hasText(business.taxId) ||
    hasText(business.mcc) ||
    hasText(business.website) ||
    business.monthlyVolume != null ||
    hasText(owner.fullName) ||
    hasText(owner.email) ||
    hasText(owner.phone) ||
    hasText(owner.ssn) ||
    owner.ownershipPercent != null ||
    hasText(banking.accountHolder) ||
    hasText(banking.routingNumber) ||
    hasText(banking.accountNumber)
  );
}

export function draftPayloadFromApplication(app: MerchantApplication): DraftFormPayload {
  return {
    business: app.business,
    owner: app.owner,
    banking: app.banking,
  };
}

export function isListableDraftApplication(app: MerchantApplication): boolean {
  if (app.status !== 'DRAFT') {
    return true;
  }
  return hasMeaningfulDraftInput(draftPayloadFromApplication(app));
}
