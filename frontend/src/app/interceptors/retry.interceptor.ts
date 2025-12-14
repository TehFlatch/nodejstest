import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { retryWhen, timer, take, concatMap, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

const shouldRetry = (error: HttpErrorResponse): boolean => {
  // Only retry on network errors or 5xx server errors
  if (!error.status) {
    return true; // Network error
  }
  
  // Retry on server errors (5xx) but not on client errors (4xx)
  return error.status >= 500 && error.status < 600;
};

export const retryInterceptor: HttpInterceptorFn = (req, next) => {
  if (!environment.enableRetry) {
    return next(req);
  }

  return next(req).pipe(
    retryWhen(errors =>
      errors.pipe(
        concatMap((error: unknown, index: number) => {
          const httpError = error as HttpErrorResponse;
          const retryCount = index + 1;
          
          if (shouldRetry(httpError) && retryCount <= environment.maxRetries) {
            const delayMs = environment.retryDelay * retryCount;
            return timer(delayMs);
          }
          
          return throwError(() => error);
        }),
        take(environment.maxRetries + 1)
      )
    )
  );
};

