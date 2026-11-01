import { UserRole } from '../models/user.model';

export type ApplicationListViewRole = 'sales' | 'reviewer' | 'admin';

export function listViewRoleForUserRole(role: UserRole | null): ApplicationListViewRole {
  switch (role) {
    case 'REVIEWER':
      return 'reviewer';
    case 'ADMIN':
      return 'admin';
    default:
      return 'sales';
  }
}

export function dashboardHeading(role: UserRole | null): { title: string; subtitle: string } {
  switch (role) {
    case 'REVIEWER':
      return {
        title: 'Assigned applications',
        subtitle: 'Review merchants assigned to you and record risk decisions.',
      };
    case 'ADMIN':
      return {
        title: 'All applications',
        subtitle:
          'View the full pipeline, assign reviewers, and create or edit draft applications when needed.',
      };
    default:
      return {
        title: 'My applications',
        subtitle: 'Create and edit draft merchant applications you are permitted to access.',
      };
  }
}

export function canCreateApplication(role: UserRole | null): boolean {
  return role === 'SALES' || role === 'ADMIN';
}

export function canEditDraftApplication(
  role: UserRole | null,
  params: { status: string; createdByUserId: string; userId: string | undefined },
): boolean {
  if (params.status !== 'DRAFT') {
    return false;
  }
  if (role === 'ADMIN') {
    return true;
  }
  return (
    role === 'SALES' &&
    !!params.userId &&
    params.createdByUserId === params.userId
  );
}

/** Same rules as edit: only DRAFT; SALES own row or ADMIN any draft. */
export function canDeleteDraftApplication(
  role: UserRole | null,
  params: { status: string; createdByUserId: string; userId: string | undefined },
): boolean {
  return canEditDraftApplication(role, params);
}

export function canSubmitDraftApplication(
  role: UserRole | null,
  params: { status: string; createdByUserId: string; userId: string | undefined },
): boolean {
  if (params.status !== 'DRAFT') {
    return false;
  }
  if (role === 'ADMIN') {
    return true;
  }
  return (
    role === 'SALES' &&
    !!params.userId &&
    params.createdByUserId === params.userId
  );
}

export function canManageAssignment(role: UserRole | null): boolean {
  return role === 'ADMIN';
}

export function canRecordReview(
  role: UserRole | null,
  params: { status: string; assignedReviewerId: string | null; userId: string | undefined },
): boolean {
  if (!['SUBMITTED', 'IN_REVIEW'].includes(params.status)) {
    return false;
  }
  if (role === 'ADMIN') {
    return true;
  }
  if (role === 'REVIEWER') {
    return !!params.userId && params.assignedReviewerId === params.userId;
  }
  return false;
}
