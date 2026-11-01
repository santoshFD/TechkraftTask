import { describe, expect, it } from 'vitest';
import {
  canCreateApplication,
  canDeleteDraftApplication,
  canEditDraftApplication,
  canManageAssignment,
  canRecordReview,
  canSubmitDraftApplication,
  dashboardHeading,
  listViewRoleForUserRole,
} from './application-role.util';

describe('application-role.util', () => {
  const ctx = { status: 'DRAFT', createdByUserId: 'u-sales-1', userId: 'u-sales-1' };

  it('maps list view roles', () => {
    expect(listViewRoleForUserRole('SALES')).toBe('sales');
    expect(listViewRoleForUserRole('REVIEWER')).toBe('reviewer');
    expect(listViewRoleForUserRole('ADMIN')).toBe('admin');
  });

  it('returns dashboard headings per role', () => {
    expect(dashboardHeading('ADMIN').title).toBe('All applications');
    expect(dashboardHeading('REVIEWER').title).toBe('Assigned applications');
    expect(dashboardHeading('SALES').title).toBe('My applications');
  });

  it('allows SALES and ADMIN to create', () => {
    expect(canCreateApplication('SALES')).toBe(true);
    expect(canCreateApplication('ADMIN')).toBe(true);
    expect(canCreateApplication('REVIEWER')).toBe(false);
  });

  it('scopes draft edit to owner SALES or any ADMIN draft', () => {
    expect(canEditDraftApplication('SALES', ctx)).toBe(true);
    expect(canEditDraftApplication('SALES', { ...ctx, userId: 'other' })).toBe(false);
    expect(canEditDraftApplication('ADMIN', { ...ctx, userId: 'u-admin-1' })).toBe(true);
    expect(canEditDraftApplication('SALES', { ...ctx, status: 'SUBMITTED' })).toBe(false);
  });

  it('scopes draft delete like edit', () => {
    expect(canDeleteDraftApplication('SALES', ctx)).toBe(true);
    expect(canDeleteDraftApplication('REVIEWER', ctx)).toBe(false);
  });

  it('scopes submit like edit for SALES and allows ADMIN', () => {
    expect(canSubmitDraftApplication('SALES', ctx)).toBe(true);
    expect(canSubmitDraftApplication('ADMIN', ctx)).toBe(true);
    expect(canSubmitDraftApplication('REVIEWER', ctx)).toBe(false);
  });

  it('allows only ADMIN to manage assignment', () => {
    expect(canManageAssignment('ADMIN')).toBe(true);
    expect(canManageAssignment('SALES')).toBe(false);
  });

  it('allows reviewer on assigned in-review apps', () => {
    expect(
      canRecordReview('REVIEWER', {
        status: 'IN_REVIEW',
        assignedReviewerId: 'u-reviewer-1',
        userId: 'u-reviewer-1',
      }),
    ).toBe(true);
    expect(
      canRecordReview('REVIEWER', {
        status: 'IN_REVIEW',
        assignedReviewerId: 'other',
        userId: 'u-reviewer-1',
      }),
    ).toBe(false);
  });
});
