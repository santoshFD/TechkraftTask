import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { delay, of, throwError } from 'rxjs';
import { authInterceptor, resetAuthInterceptorState } from './auth.interceptor';
import { TokenStorageService } from '../auth/token-storage.service';
import { AuthService } from '../auth/auth.service';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let auth: AuthService;
  let router: Router;

  beforeEach(() => {
    resetAuthInterceptorState();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'login', children: [] }]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        TokenStorageService,
        AuthService,
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    TestBed.inject(TokenStorageService).setTokens('old-access', 'refresh-1');
  });

  afterEach(() => {
    httpMock.verify();
    resetAuthInterceptorState();
    TestBed.resetTestingModule();
  });

  it('refreshes once and retries concurrent 401 responses', () => {
    const refreshSpy = vi
      .spyOn(auth, 'refreshAccessToken')
      .mockReturnValue(of('new-access-token').pipe(delay(0)));

    http.get('/api/applications').subscribe();
    http.get('/api/applications').subscribe();

    const initial = httpMock.match('/api/applications');
    expect(initial.length).toBe(2);
    initial.forEach((req) => req.flush({}, { status: 401, statusText: 'Unauthorized' }));

    expect(refreshSpy).toHaveBeenCalledTimes(1);

    return new Promise<void>((resolve) => {
      setTimeout(() => {
        const retries = httpMock.match('/api/applications');
        expect(retries.length).toBe(2);
        retries.forEach((req) =>
          req.flush({ items: [], total: 0, page: 0, pageSize: 10 }),
        );
        resolve();
      }, 0);
    });
  });

  it('logs out when refresh fails', () => {
    vi.spyOn(auth, 'refreshAccessToken').mockReturnValue(throwError(() => new Error('refresh failed')));
    const logoutSpy = vi.spyOn(auth, 'logout').mockImplementation(() => undefined);

    http.get('/api/applications').subscribe({ error: () => undefined });
    httpMock.expectOne('/api/applications').flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(logoutSpy).toHaveBeenCalled();
    httpMock.expectNone('/api/applications');
  });
});
