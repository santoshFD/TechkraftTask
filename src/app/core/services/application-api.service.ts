import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AssignReviewerPayload,
  ApplicationQuery,
  MerchantApplication,
  PagedResult,
  ApplicationListItem,
  ApplicationDashboardStats,
  ApplicationFieldCheck,
  FieldAvailabilityResult,
  ReviewPayload,
  ReviewerOption,
} from '../models/application.model';
import { MockApplicationCacheService } from './mock-application-cache.service';

@Injectable({ providedIn: 'root' })
export class ApplicationApiService {
  private readonly http = inject(HttpClient);
  private readonly mockCache = inject(MockApplicationCacheService);
  private readonly base = `${environment.apiBaseUrl}/applications`;

  getStats(): Observable<ApplicationDashboardStats> {
    return this.http.get<ApplicationDashboardStats>(`${this.base}/stats`);
  }

  list(query: ApplicationQuery): Observable<PagedResult<ApplicationListItem>> {
    let params = new HttpParams()
      .set('page', String(query.page))
      .set('pageSize', String(query.pageSize));
    if (query.status) {
      params = params.set('status', query.status);
    }
    if (query.search) {
      params = params.set('search', query.search);
    }
    if (query.sortBy) {
      params = params.set('sortBy', query.sortBy);
    }
    if (query.sortDirection) {
      params = params.set('sortDirection', query.sortDirection);
    }
    return this.http.get<PagedResult<ApplicationListItem>>(this.base, { params });
  }

  getById(id: string): Observable<MerchantApplication> {
    return this.http.get<MerchantApplication>(`${this.base}/${id}`).pipe(tap((app) => this.mockCache.upsert(app)));
  }

  checkFieldAvailability(check: ApplicationFieldCheck): Observable<FieldAvailabilityResult> {
    const params = new HttpParams()
      .set('field', check.field)
      .set('value', check.value)
      .set('excludeId', check.excludeApplicationId);
    return this.http.get<FieldAvailabilityResult>(`${this.base}/field-availability`, { params });
  }

  createDraft(): Observable<MerchantApplication> {
    return this.http.post<MerchantApplication>(this.base, {}).pipe(tap((app) => this.mockCache.upsert(app)));
  }

  save(id: string, payload: Partial<MerchantApplication>): Observable<MerchantApplication> {
    return this.http
      .put<MerchantApplication>(`${this.base}/${id}`, payload)
      .pipe(tap((app) => this.mockCache.upsert(app)));
  }

  submit(id: string): Observable<MerchantApplication> {
    return this.http
      .post<MerchantApplication>(`${this.base}/${id}/submit`, {})
      .pipe(tap((app) => this.mockCache.upsert(app)));
  }

  review(id: string, payload: ReviewPayload): Observable<MerchantApplication> {
    return this.http
      .post<MerchantApplication>(`${this.base}/${id}/review`, payload)
      .pipe(tap((app) => this.mockCache.upsert(app)));
  }

  listReviewers(): Observable<ReviewerOption[]> {
    return this.http.get<ReviewerOption[]>(`${environment.apiBaseUrl}/users/reviewers`);
  }

  assignReviewer(id: string, payload: AssignReviewerPayload): Observable<MerchantApplication> {
    return this.http.patch<MerchantApplication>(`${this.base}/${id}/assignment`, payload);
  }

  deleteDraft(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`).pipe(
      tap(() => this.mockCache.remove(id)),
    );
  }

  simulateTokenExpiry(): Observable<{ ok: boolean }> {
    return this.http.post<{ ok: boolean }>(`${environment.apiBaseUrl}/dev/simulate-token-expiry`, {});
  }
}
