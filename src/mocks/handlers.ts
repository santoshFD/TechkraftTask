import { http, HttpResponse } from 'msw';
import {
  ApplicationListItem,
  ApplicationQuery,
  MerchantApplication,
  PagedResult,
  ReviewPayload,
} from '../app/core/models/application.model';
import { issueAccessToken, getRoleFromAuthHeader, getUserIdFromAuthHeader } from './auth.util';
import {
  createId,
  findApplication,
  findUserByEmail,
  getApplications,
  getSession,
  getUsers,
  saveSession,
  deleteSession,
  upsertApplication,
  deleteApplication,
  hydrateApplications,
  setForceAccessExpired,
  registerUser,
  verifyPassword,
} from './store';
import { isListableDraftApplication } from '../app/features/applications/form/draft-input.util';
import { isLegalNameTaken, isTaxIdTaken } from '../app/shared/validators/application-identity.util';

function unauthorized(): HttpResponse {
  return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 });
}

function forbidden(): HttpResponse {
  return HttpResponse.json({ message: 'Forbidden' }, { status: 403 });
}

function filterForUser(userId: string | null, role: ReturnType<typeof getRoleFromAuthHeader>): MerchantApplication[] {
  const all = getApplications();
  if (!userId || !role) {
    return [];
  }
  if (role === 'ADMIN') {
    return all;
  }
  if (role === 'SALES') {
    return all.filter((a) => a.createdByUserId === userId);
  }
  return all.filter((a) => a.assignedReviewerId === userId);
}

function visibleApplicationsForUser(
  userId: string | null,
  role: ReturnType<typeof getRoleFromAuthHeader>,
): MerchantApplication[] {
  return filterForUser(userId, role).filter(isListableDraftApplication);
}

function toListItem(app: MerchantApplication): ApplicationListItem {
  return {
    id: app.id,
    status: app.status,
    legalName: app.business.legalName || '(Untitled draft)',
    createdByUserId: app.createdByUserId,
    createdByName: app.createdByName,
    assignedReviewerName: app.assignedReviewerName,
    assignedReviewerId: app.assignedReviewerId,
    updatedAt: app.updatedAt,
  };
}

export const handlers = [
  http.post('/api/auth/login', async ({ request }) => {
    const body = (await request.json()) as { email: string; password: string };
    const user = findUserByEmail(body.email);
    if (!user || !verifyPassword(body.email, body.password)) {
      return HttpResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }
    const refreshToken = createId('refresh');
    const accessToken = issueAccessToken(user);
    const claims = JSON.parse(atob(accessToken.slice('mock-access.'.length))) as { exp: number };
    saveSession(refreshToken, {
      userId: user.id,
      refreshToken,
      accessToken,
      accessExpiresAt: claims.exp,
    });
    setForceAccessExpired(false);
    return HttpResponse.json({
      user,
      accessToken,
      refreshToken,
      expiresIn: 300,
    });
  }),

  http.post('/api/auth/register', async ({ request }) => {
    const body = (await request.json()) as {
      displayName: string;
      email: string;
      password: string;
    };
    try {
      const user = registerUser(body);
      const refreshToken = createId('refresh');
      const accessToken = issueAccessToken(user);
      const claims = JSON.parse(atob(accessToken.slice('mock-access.'.length))) as { exp: number };
      saveSession(refreshToken, {
        userId: user.id,
        refreshToken,
        accessToken,
        accessExpiresAt: claims.exp,
      });
      setForceAccessExpired(false);
      return HttpResponse.json(
        {
          user,
          accessToken,
          refreshToken,
          expiresIn: 300,
        },
        { status: 201 },
      );
    } catch {
      return HttpResponse.json({ message: 'Email already registered' }, { status: 409 });
    }
  }),

  http.post('/api/auth/refresh', async ({ request }) => {
    const body = (await request.json()) as { refreshToken: string };
    const session = getSession(body.refreshToken);
    if (!session) {
      return HttpResponse.json({ message: 'Invalid refresh token' }, { status: 401 });
    }
    const user = getUsers().find((u) => u.id === session.userId);
    if (!user) {
      return HttpResponse.json({ message: 'User not found' }, { status: 401 });
    }
    const accessToken = issueAccessToken(user);
    const claims = JSON.parse(atob(accessToken.slice('mock-access.'.length))) as { exp: number };
    session.accessToken = accessToken;
    session.accessExpiresAt = claims.exp;
    saveSession(body.refreshToken, session);
    setForceAccessExpired(false);
    return HttpResponse.json({
      accessToken,
      refreshToken: body.refreshToken,
      expiresIn: 300,
    });
  }),

  http.get('/api/applications/stats', ({ request }) => {
    const auth = request.headers.get('Authorization');
    const userId = getUserIdFromAuthHeader(auth);
    const role = getRoleFromAuthHeader(auth);
    if (!userId) {
      return unauthorized();
    }
    const visible = visibleApplicationsForUser(userId, role);
    const stats = {
      draft: visible.filter((a) => a.status === 'DRAFT').length,
      pendingReview: visible.filter((a) => a.status === 'SUBMITTED' || a.status === 'IN_REVIEW').length,
      completed: visible.filter((a) => a.status === 'APPROVED' || a.status === 'REJECTED').length,
      total: visible.length,
    };
    return HttpResponse.json(stats);
  }),

  http.get('/api/applications', ({ request }) => {
    const auth = request.headers.get('Authorization');
    const userId = getUserIdFromAuthHeader(auth);
    const role = getRoleFromAuthHeader(auth);
    if (!userId) {
      return unauthorized();
    }

    const url = new URL(request.url);
    const query: ApplicationQuery = {
      page: Number(url.searchParams.get('page') ?? '0'),
      pageSize: Number(url.searchParams.get('pageSize') ?? '10'),
      status: (url.searchParams.get('status') ?? '') as ApplicationQuery['status'],
      search: url.searchParams.get('search') ?? '',
      sortBy: (url.searchParams.get('sortBy') ?? 'updatedAt') as ApplicationQuery['sortBy'],
      sortDirection: (url.searchParams.get('sortDirection') ?? 'desc') as ApplicationQuery['sortDirection'],
    };

    let items = visibleApplicationsForUser(userId, role).map(toListItem);
    if (query.status) {
      items = items.filter((i) => i.status === query.status);
    }
    if (query.search?.trim()) {
      const q = query.search.trim().toLowerCase();
      items = items.filter(
        (i) =>
          i.legalName.toLowerCase().includes(q) ||
          i.id.toLowerCase().includes(q) ||
          i.createdByName.toLowerCase().includes(q),
      );
    }
    const sortBy = query.sortBy ?? 'updatedAt';
    const sortDirection = query.sortDirection ?? 'desc';
    const direction = sortDirection === 'asc' ? 1 : -1;
    items.sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case 'legalName':
          cmp = a.legalName.localeCompare(b.legalName);
          break;
        case 'status':
          cmp = a.status.localeCompare(b.status);
          break;
        case 'createdByName':
          cmp = a.createdByName.localeCompare(b.createdByName);
          break;
        case 'assignedReviewerName':
          cmp = (a.assignedReviewerName ?? '').localeCompare(b.assignedReviewerName ?? '');
          break;
        case 'updatedAt':
        default:
          cmp = a.updatedAt.localeCompare(b.updatedAt);
          break;
      }
      return cmp * direction;
    });

    const total = items.length;
    const start = query.page * query.pageSize;
    const pageItems = items.slice(start, start + query.pageSize);
    const result: PagedResult<ApplicationListItem> = {
      items: pageItems,
      total,
      page: query.page,
      pageSize: query.pageSize,
    };
    return HttpResponse.json(result);
  }),

  http.get('/api/applications/field-availability', ({ request }) => {
    const auth = request.headers.get('Authorization');
    const userId = getUserIdFromAuthHeader(auth);
    const role = getRoleFromAuthHeader(auth);
    if (!userId) {
      return unauthorized();
    }

    const url = new URL(request.url);
    const field = url.searchParams.get('field');
    const value = url.searchParams.get('value') ?? '';
    const excludeId = url.searchParams.get('excludeId') ?? '';
    const visible = filterForUser(userId, role);

    let available = true;
    if (field === 'legalName') {
      available = !isLegalNameTaken(visible, value, excludeId);
    } else if (field === 'taxId') {
      available = !isTaxIdTaken(visible, value, excludeId);
    }

    return HttpResponse.json({ available });
  }),

  http.get('/api/applications/:id', ({ request, params }) => {
    const auth = request.headers.get('Authorization');
    const userId = getUserIdFromAuthHeader(auth);
    const role = getRoleFromAuthHeader(auth);
    if (!userId) {
      return unauthorized();
    }
    const app = findApplication(String(params['id']));
    if (!app) {
      return HttpResponse.json({ message: 'Not found' }, { status: 404 });
    }
    const visible = filterForUser(userId, role).some((a) => a.id === app.id);
    if (!visible) {
      return forbidden();
    }
    return HttpResponse.json(app);
  }),

  http.post('/api/applications', ({ request }) => {
    const auth = request.headers.get('Authorization');
    const userId = getUserIdFromAuthHeader(auth);
    const role = getRoleFromAuthHeader(auth);
    if (!userId) {
      return unauthorized();
    }
    if (role !== 'SALES' && role !== 'ADMIN') {
      return forbidden();
    }
    const user = getUsers().find((u) => u.id === userId);
    if (!user) {
      return forbidden();
    }
    const now = new Date().toISOString();
    const app: MerchantApplication = {
      id: createId('app'),
      status: 'DRAFT',
      createdByUserId: user.id,
      createdByName: user.displayName,
      assignedReviewerId: null,
      assignedReviewerName: null,
      business: {
        legalName: '',
        dba: '',
        taxId: '',
        mcc: '',
        website: '',
        monthlyVolume: null,
      },
      owner: {
        fullName: '',
        email: '',
        phone: '',
        ownershipPercent: null,
        ssn: '',
      },
      banking: {
        accountHolder: '',
        routingNumber: '',
        accountNumber: '',
      },
      riskHistory: [],
      updatedAt: now,
      submittedAt: null,
    };
    upsertApplication(app);
    return HttpResponse.json(app, { status: 201 });
  }),

  http.put('/api/applications/:id', async ({ request, params }) => {
    const auth = request.headers.get('Authorization');
    const userId = getUserIdFromAuthHeader(auth);
    const role = getRoleFromAuthHeader(auth);
    if (!userId) {
      return unauthorized();
    }
    const existing = findApplication(String(params['id']));
    if (!existing) {
      return HttpResponse.json({ message: 'Not found' }, { status: 404 });
    }
    const canEdit =
      (role === 'SALES' && existing.createdByUserId === userId && existing.status === 'DRAFT') ||
      (role === 'ADMIN' && existing.status === 'DRAFT');
    if (!canEdit) {
      return forbidden();
    }
    const patch = (await request.json()) as Partial<MerchantApplication>;
    const mergedBusiness = { ...existing.business, ...patch.business };
    const allVisible = getApplications();

    if (
      mergedBusiness.legalName &&
      isLegalNameTaken(allVisible, mergedBusiness.legalName, existing.id)
    ) {
      return HttpResponse.json({ message: 'Legal name already in use' }, { status: 409 });
    }
    if (mergedBusiness.taxId && isTaxIdTaken(allVisible, mergedBusiness.taxId, existing.id)) {
      return HttpResponse.json({ message: 'Tax ID already in use' }, { status: 409 });
    }

    const updated: MerchantApplication = {
      ...existing,
      ...patch,
      business: mergedBusiness,
      owner: { ...existing.owner, ...patch.owner },
      banking: { ...existing.banking, ...patch.banking },
      id: existing.id,
      status: existing.status === 'DRAFT' ? 'DRAFT' : existing.status,
      updatedAt: new Date().toISOString(),
    };
    upsertApplication(updated);
    return HttpResponse.json(updated);
  }),

  http.delete('/api/applications/:id', ({ request, params }) => {
    const auth = request.headers.get('Authorization');
    const userId = getUserIdFromAuthHeader(auth);
    const role = getRoleFromAuthHeader(auth);
    if (!userId) {
      return unauthorized();
    }
    const existing = findApplication(String(params['id']));
    if (!existing) {
      return HttpResponse.json({ message: 'Not found' }, { status: 404 });
    }
    const canDelete =
      (role === 'SALES' && existing.createdByUserId === userId && existing.status === 'DRAFT') ||
      (role === 'ADMIN' && existing.status === 'DRAFT');
    if (!canDelete) {
      return forbidden();
    }
    deleteApplication(existing.id);
    return new HttpResponse(null, { status: 204 });
  }),

  http.post('/api/applications/:id/submit', ({ request, params }) => {
    const auth = request.headers.get('Authorization');
    const userId = getUserIdFromAuthHeader(auth);
    const role = getRoleFromAuthHeader(auth);
    if (!userId) {
      return unauthorized();
    }
    const existing = findApplication(String(params['id']));
    if (!existing) {
      return HttpResponse.json({ message: 'Not found' }, { status: 404 });
    }
    const canSubmit =
      (role === 'SALES' && existing.createdByUserId === userId) ||
      (role === 'ADMIN');
    if (!canSubmit) {
      return forbidden();
    }
    if (existing.status !== 'DRAFT') {
      return HttpResponse.json({ message: 'Only drafts can be submitted' }, { status: 400 });
    }
    const reviewer = getUsers().find((u) => u.role === 'REVIEWER');
    const updated: MerchantApplication = {
      ...existing,
      status: 'SUBMITTED',
      submittedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      assignedReviewerId: reviewer?.id ?? null,
      assignedReviewerName: reviewer?.displayName ?? null,
      riskHistory: [
        ...existing.riskHistory,
        {
          id: createId('risk'),
          at: new Date().toISOString(),
          actorName: existing.createdByName,
          actorRole: role === 'ADMIN' ? 'ADMIN' : 'SALES',
          summary: 'Application submitted',
          level: 'LOW',
        },
      ],
    };
    upsertApplication(updated);
    return HttpResponse.json(updated);
  }),

  http.get('/api/users/reviewers', ({ request }) => {
    const auth = request.headers.get('Authorization');
    const userId = getUserIdFromAuthHeader(auth);
    const role = getRoleFromAuthHeader(auth);
    if (!userId) {
      return unauthorized();
    }
    if (role !== 'ADMIN') {
      return forbidden();
    }
    const reviewers = getUsers()
      .filter((u) => u.role === 'REVIEWER')
      .map((u) => ({ id: u.id, displayName: u.displayName, email: u.email }));
    return HttpResponse.json(reviewers);
  }),

  http.patch('/api/applications/:id/assignment', async ({ request, params }) => {
    const auth = request.headers.get('Authorization');
    const userId = getUserIdFromAuthHeader(auth);
    const role = getRoleFromAuthHeader(auth);
    if (!userId) {
      return unauthorized();
    }
    if (role !== 'ADMIN') {
      return forbidden();
    }
    const existing = findApplication(String(params['id']));
    if (!existing) {
      return HttpResponse.json({ message: 'Not found' }, { status: 404 });
    }
    if (!['SUBMITTED', 'IN_REVIEW'].includes(existing.status)) {
      return HttpResponse.json({ message: 'Assignment only for submitted or in-review applications' }, { status: 400 });
    }
    const body = (await request.json()) as { reviewerId: string | null };
    const admin = getUsers().find((u) => u.id === userId)!;
    let assignedReviewerId: string | null = null;
    let assignedReviewerName: string | null = null;
    if (body.reviewerId) {
      const reviewer = getUsers().find((u) => u.id === body.reviewerId && u.role === 'REVIEWER');
      if (!reviewer) {
        return HttpResponse.json({ message: 'Invalid reviewer' }, { status: 400 });
      }
      assignedReviewerId = reviewer.id;
      assignedReviewerName = reviewer.displayName;
    }
    const summary = assignedReviewerName
      ? `Assigned to ${assignedReviewerName}`
      : 'Reviewer assignment cleared';
    const updated: MerchantApplication = {
      ...existing,
      assignedReviewerId,
      assignedReviewerName,
      status: existing.status === 'SUBMITTED' ? 'IN_REVIEW' : existing.status,
      updatedAt: new Date().toISOString(),
      riskHistory: [
        ...existing.riskHistory,
        {
          id: createId('risk'),
          at: new Date().toISOString(),
          actorName: admin.displayName,
          actorRole: admin.role,
          summary,
          level: 'MEDIUM',
        },
      ],
    };
    upsertApplication(updated);
    return HttpResponse.json(updated);
  }),

  http.post('/api/applications/:id/review', async ({ request, params }) => {
    const auth = request.headers.get('Authorization');
    const userId = getUserIdFromAuthHeader(auth);
    const role = getRoleFromAuthHeader(auth);
    if (!userId) {
      return unauthorized();
    }
    if (role !== 'REVIEWER' && role !== 'ADMIN') {
      return forbidden();
    }
    const existing = findApplication(String(params['id']));
    if (!existing) {
      return HttpResponse.json({ message: 'Not found' }, { status: 404 });
    }
    if (role === 'REVIEWER' && existing.assignedReviewerId !== userId) {
      return forbidden();
    }
    const body = (await request.json()) as ReviewPayload;
    const reviewer = getUsers().find((u) => u.id === userId)!;
    const updated: MerchantApplication = {
      ...existing,
      status: body.decision === 'APPROVE' ? 'APPROVED' : 'REJECTED',
      updatedAt: new Date().toISOString(),
      riskHistory: [
        ...existing.riskHistory,
        {
          id: createId('risk'),
          at: new Date().toISOString(),
          actorName: reviewer.displayName,
          actorRole: reviewer.role,
          summary: `${body.decision}: ${body.notes}`,
          level: body.riskLevel,
        },
      ],
    };
    upsertApplication(updated);
    return HttpResponse.json(updated);
  }),

  /** Dev-only: force the next wave of API calls to return 401 until refresh. */
  http.post('/api/dev/hydrate-applications', async ({ request }) => {
    const body = (await request.json()) as { applications?: MerchantApplication[] };
    if (!Array.isArray(body.applications)) {
      return HttpResponse.json({ message: 'applications array required' }, { status: 400 });
    }
    hydrateApplications(body.applications);
    return HttpResponse.json({ ok: true, count: getApplications().length });
  }),

  http.post('/api/dev/simulate-token-expiry', () => {
    setForceAccessExpired(true);
    return HttpResponse.json({ ok: true });
  }),
];
