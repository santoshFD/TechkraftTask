import { EnvironmentProviders, Provider } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';

const testProviders: (Provider | EnvironmentProviders)[] = [
  provideZonelessChangeDetection(),
  provideHttpClient(),
  provideHttpClientTesting(),
];

export default testProviders;
