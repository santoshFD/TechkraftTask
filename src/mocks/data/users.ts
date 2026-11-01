import { User } from '../../app/core/models/user.model';

export const MOCK_USERS: User[] = [
  {
    id: 'u-sales-1',
    email: 'sales@merchant.test',
    displayName: 'Sara Sales',
    role: 'SALES',
  },
  {
    id: 'u-reviewer-1',
    email: 'reviewer@merchant.test',
    displayName: 'Ravi Reviewer',
    role: 'REVIEWER',
  },
  {
    id: 'u-admin-1',
    email: 'admin@merchant.test',
    displayName: 'Asha Admin',
    role: 'ADMIN',
  },
];
