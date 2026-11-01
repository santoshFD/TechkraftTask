import { describe, expect, it } from 'vitest';
import { ALL_USER_ROLES, USER_ROLE_DEFINITIONS, userRoleLabel } from './user-roles.constants';

describe('user-roles.constants', () => {
  it('lists all three portal roles', () => {
    expect(ALL_USER_ROLES).toEqual(['SALES', 'REVIEWER', 'ADMIN']);
    expect(USER_ROLE_DEFINITIONS).toHaveLength(3);
  });

  it('returns display labels', () => {
    expect(userRoleLabel('ADMIN')).toBe('Admin');
  });
});
