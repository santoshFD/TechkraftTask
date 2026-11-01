import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { environment } from './environments/environment';

async function prepareMocks(): Promise<void> {
  if (!environment.enableMsw) {
    return;
  }
  const { worker } = await import('./mocks/browser');
  await worker.start({
    onUnhandledRequest: 'bypass',
    serviceWorker: { url: '/mockServiceWorker.js' },
  });
}

prepareMocks()
  .then(() => bootstrapApplication(App, appConfig))
  .catch((err) => console.error(err));
