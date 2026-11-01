import { UserRole } from '../models/user.model';
import {
  canCreateApplication,
  canDeleteDraftApplication,
  canEditDraftApplication,
  canManageAssignment,
  canRecordReview,
  canSubmitDraftApplication,
} from './application-role.util';

/** Named permissions aligned with MSW handlers and `application-role.util`. */
export type ApplicationPermission =
  | 'applications.create'
  | 'applications.editDraft'
  | 'applications.deleteDraft'
  | 'applications.submitDraft'
  | 'applications.assignReviewer'
  | 'applications.review';

export interface ApplicationPermissionContext {
  status?: string;
  createdByUserId?: string;
  assignedReviewerId?: string | null;
}

export function hasApplicationPermission(
  permission: ApplicationPermission,
  role: UserRole | null,
  userId: string | undefined,
  context: ApplicationPermissionContext = {},
): boolean {
  switch (permission) {
    case 'applications.create':
      return canCreateApplication(role);
    case 'applications.editDraft':
      return canEditDraftApplication(role, {
        status: context.status ?? '',
        createdByUserId: context.createdByUserId ?? '',
        userId,
      });
    case 'applications.deleteDraft':
      return canDeleteDraftApplication(role, {
        status: context.status ?? '',
        createdByUserId: context.createdByUserId ?? '',
        userId,
      });
    case 'applications.submitDraft':
      return canSubmitDraftApplication(role, {
        status: context.status ?? '',
        createdByUserId: context.createdByUserId ?? '',
        userId,
      });
    case 'applications.assignReviewer':
      return canManageAssignment(role);
    case 'applications.review':
      return canRecordReview(role, {
        status: context.status ?? '',
        assignedReviewerId: context.assignedReviewerId ?? null,
        userId,
      });
    default:
      return false;
  }
}
