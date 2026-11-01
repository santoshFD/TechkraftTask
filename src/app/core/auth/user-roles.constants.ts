import { UserRole } from '../models/user.model';

export interface UserRoleDefinition {
  id: UserRole;
  label: string;
  description: string;
}

/** All portal user roles (single source of truth for RBAC UI and docs). */
export const USER_ROLE_DEFINITIONS: readonly UserRoleDefinition[] = [
  {
    id: 'SALES',
    label: 'Sales',
    description: 'Creates and submits merchant applications; sees only own drafts and applications.',
  },
  {
    id: 'REVIEWER',
    label: 'Reviewer',
    description: 'Reviews assigned applications; records risk decisions on submitted or in-review work.',
  },
  {
    id: 'ADMIN',
    label: 'Admin',
    description: 'Full pipeline visibility; assigns reviewers; can create, edit, and submit drafts for support.',
  },
] as const;

export const ALL_USER_ROLES: readonly UserRole[] = USER_ROLE_DEFINITIONS.map((r) => r.id);

export function userRoleLabel(role: UserRole): string {
  return USER_ROLE_DEFINITIONS.find((r) => r.id === role)?.label ?? role;
}
