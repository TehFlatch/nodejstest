import {
  ApplicationConfig,
  provideZonelessChangeDetection,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter, withComponentInputBinding } from '@angular/router'; //
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()), // Add this line
    provideAnimationsAsync(),

    provideHttpClient(
      withInterceptors([
        (req, next) => {
          const cloned = req.clone({
            setHeaders: { Authorization: `Bearer fake-jwt-token` },
          });
          return next(cloned);
        },
      ])
    ),
  ],
};
