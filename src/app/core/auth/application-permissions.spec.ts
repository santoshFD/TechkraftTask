import { describe, expect, it } from 'vitest';
import { hasApplicationPermission } from './application-permissions';

describe('hasApplicationPermission', () => {
  const draftCtx = { status: 'DRAFT', createdByUserId: 'u-sales-1' };

  it('gates create by role', () => {
    expect(hasApplicationPermission('applications.create', 'SALES', 'u-sales-1')).toBe(true);
    expect(hasApplicationPermission('applications.create', 'REVIEWER', 'u-reviewer-1')).toBe(false);
  });

  it('gates editDraft with row context', () => {
    expect(hasApplicationPermission('applications.editDraft', 'SALES', 'u-sales-1', draftCtx)).toBe(true);
    expect(hasApplicationPermission('applications.editDraft', 'SALES', 'other', draftCtx)).toBe(false);
    expect(hasApplicationPermission('applications.editDraft', 'ADMIN', 'u-admin-1', draftCtx)).toBe(true);
  });

  it('gates deleteDraft like editDraft', () => {
    expect(hasApplicationPermission('applications.deleteDraft', 'SALES', 'u-sales-1', draftCtx)).toBe(true);
    expect(hasApplicationPermission('applications.deleteDraft', 'REVIEWER', 'u-reviewer-1', draftCtx)).toBe(false);
  });

  it('gates assignReviewer to ADMIN', () => {
    expect(hasApplicationPermission('applications.assignReviewer', 'ADMIN', 'u-admin-1')).toBe(true);
    expect(hasApplicationPermission('applications.assignReviewer', 'SALES', 'u-sales-1')).toBe(false);
  });
});
