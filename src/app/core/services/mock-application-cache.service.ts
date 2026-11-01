import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MerchantApplication } from '../models/application.model';

const STORAGE_KEY = 'mp_mock_applications_v1';

/**
 * Keeps MSW draft applications across full page reloads (in-memory mock store resets otherwise).
 */
@Injectable({ providedIn: 'root' })
export class MockApplicationCacheService {
  private readonly http = inject(HttpClient);

  restoreToMockBackend(): Observable<void> {
    if (!environment.enableMsw) {
      return of(undefined);
    }
    const applications = this.readAll();
    if (!applications.length) {
      return of(undefined);
    }
    return this.http
      .post<{ ok: boolean }>(`${environment.apiBaseUrl}/dev/hydrate-applications`, { applications })
      .pipe(map(() => undefined));
  }

  upsert(app: MerchantApplication): void {
    if (!environment.enableMsw || !app?.id) {
      return;
    }
    const all = this.readAll();
    const idx = all.findIndex((item) => item.id === app.id);
    if (idx >= 0) {
      all[idx] = app;
    } else {
      all.push(app);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  }

  remove(id: string): void {
    if (!environment.enableMsw) {
      return;
    }
    const next = this.readAll().filter((item) => item.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  private readAll(): MerchantApplication[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return [];
      }
      const parsed = JSON.parse(raw) as unknown;
      return Array.isArray(parsed) ? (parsed as MerchantApplication[]) : [];
    } catch {
      return [];
    }
  }
}
