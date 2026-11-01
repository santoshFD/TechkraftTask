import { MerchantApplication } from '../app/core/models/application.model';
import { User } from '../app/core/models/user.model';
import { SEED_APPLICATIONS } from './data/applications.seed';
import { MOCK_USERS } from './data/users';
import { UserRole } from '../app/core/models/user.model';

export interface SessionRecord {
  userId: string;
  refreshToken: string;
  accessToken: string;
  accessExpiresAt: number;
}

const sessions = new Map<string, SessionRecord>();
const registeredPasswords = new Map<string, string>();
let users: User[] = structuredClone(MOCK_USERS);
let applications: MerchantApplication[] = structuredClone(SEED_APPLICATIONS);

/** Simulates expired access tokens until refresh is called once. */
let forceAccessExpired = false;

export function setForceAccessExpired(value: boolean): void {
  forceAccessExpired = value;
}

export function getForceAccessExpired(): boolean {
  return forceAccessExpired;
}

export function getUsers(): User[] {
  return users;
}

export function findUserByEmail(email: string): User | undefined {
  return users.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export function registerUser(input: {
  displayName: string;
  email: string;
  password: string;
  role?: UserRole;
}): User {
  const email = input.email.toLowerCase();
  if (findUserByEmail(email)) {
    throw new Error('EMAIL_EXISTS');
  }
  const user: User = {
    id: createId('u'),
    email,
    displayName: input.displayName.trim(),
    role: input.role ?? 'SALES',
  };
  users = [...users, user];
  registeredPasswords.set(email, input.password);
  return user;
}

export function verifyPassword(email: string, password: string): boolean {
  const normalized = email.toLowerCase();
  const custom = registeredPasswords.get(normalized);
  if (custom) {
    return custom === password;
  }
  const user = findUserByEmail(normalized);
  return Boolean(user && password === 'password');
}

export function getApplications(): MerchantApplication[] {
  return applications;
}

export function setApplications(next: MerchantApplication[]): void {
  applications = next;
}

export function findApplication(id: string): MerchantApplication | undefined {
  return applications.find((a) => a.id === id);
}

export function upsertApplication(app: MerchantApplication): void {
  const idx = applications.findIndex((a) => a.id === app.id);
  if (idx >= 0) {
    applications[idx] = app;
  } else {
    applications.push(app);
  }
}

export function deleteApplication(id: string): boolean {
  const before = applications.length;
  applications = applications.filter((a) => a.id !== id);
  return applications.length < before;
}

/** Merge client-persisted drafts with in-memory seed (stored wins on id collision). */
export function hydrateApplications(stored: MerchantApplication[]): void {
  const byId = new Map<string, MerchantApplication>();
  for (const seed of structuredClone(SEED_APPLICATIONS)) {
    byId.set(seed.id, seed);
  }
  for (const app of stored) {
    if (app?.id) {
      byId.set(app.id, app);
    }
  }
  applications = [...byId.values()];
}

export function saveSession(refreshToken: string, record: SessionRecord): void {
  sessions.set(refreshToken, record);
}

export function getSession(refreshToken: string): SessionRecord | undefined {
  return sessions.get(refreshToken);
}

export function deleteSession(refreshToken: string): void {
  sessions.delete(refreshToken);
}

export function createId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}
