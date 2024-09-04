import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { APP_INITIALIZER, ErrorHandler } from '@angular/core';
import { Router } from '@angular/router';
import {
  //   init,
  createErrorHandler,
  TraceService,
} from '@sentry/angular';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    [
      {
        provide: ErrorHandler,
        useValue: createErrorHandler({
          showDialog: false,
        }),
      },
      {
        provide: TraceService,
        deps: [Router],
      },
      {
        provide: APP_INITIALIZER,
        useFactory: () => () => {},
        deps: [TraceService],
        multi: true,
      },
    ],
  ],
};
