import { User } from '../app/core/models/user.model';
import { getForceAccessExpired } from './store';

export interface AccessClaims {
  sub: string;
  role: User['role'];
  exp: number;
  email?: string;
  displayName?: string;
}

const ACCESS_TTL_MS = 5 * 60 * 1000;

export function issueAccessToken(user: User, expiresAt?: number): string {
  const exp = expiresAt ?? Date.now() + ACCESS_TTL_MS;
  const payload: AccessClaims = {
    sub: user.id,
    role: user.role,
    exp,
    email: user.email,
    displayName: user.displayName,
  };
  return `mock-access.${btoa(JSON.stringify(payload))}`;
}

export function parseAccessToken(token: string): AccessClaims | null {
  if (!token.startsWith('mock-access.')) {
    return null;
  }
  try {
    const payload = JSON.parse(atob(token.slice('mock-access.'.length))) as AccessClaims;
    return payload;
  } catch {
    return null;
  }
}

export function isAccessTokenValid(token: string): boolean {
  const claims = parseAccessToken(token);
  if (!claims) {
    return false;
  }
  if (getForceAccessExpired()) {
    return false;
  }
  return claims.exp > Date.now();
}

export function getUserIdFromAuthHeader(authHeader: string | null): string | null {
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.slice(7);
  if (!isAccessTokenValid(token)) {
    return null;
  }
  return parseAccessToken(token)?.sub ?? null;
}

export function getRoleFromAuthHeader(authHeader: string | null): User['role'] | null {
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.slice(7);
  if (!isAccessTokenValid(token)) {
    return null;
  }
  return parseAccessToken(token)?.role ?? null;
}
