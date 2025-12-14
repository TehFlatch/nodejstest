import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'An unexpected error occurred';

      if (error.error instanceof ErrorEvent) {
        // Client-side error
        errorMessage = `Error: ${error.error.message}`;
        console.error('Client-side error:', error.error);
      } else {
        // Server-side error
        const serverError = error.error;
        
        if (serverError && typeof serverError === 'object') {
          if ('message' in serverError && typeof serverError.message === 'string') {
            errorMessage = serverError.message;
          } else if ('error' in serverError && typeof serverError.error === 'object' && serverError.error !== null) {
            const errorObj = serverError.error as { message?: string };
            if (errorObj.message) {
              errorMessage = errorObj.message;
            }
          }
        }

        // Handle specific HTTP status codes
        switch (error.status) {
          case 401:
            // Unauthorized - logout user
            authService.logout();
            router.navigate(['/login'], { queryParams: { returnUrl: router.url } });
            errorMessage = 'Your session has expired. Please log in again.';
            break;
          case 403:
            errorMessage = 'You do not have permission to perform this action.';
            break;
          case 404:
            errorMessage = 'The requested resource was not found.';
            break;
          case 429:
            errorMessage = 'Too many requests. Please try again later.';
            break;
          case 500:
            errorMessage = 'A server error occurred. Please try again later.';
            break;
          case 503:
            errorMessage = 'Service temporarily unavailable. Please try again later.';
            break;
        }

        console.error('Server error:', {
          status: error.status,
          message: errorMessage,
          url: req.url,
        });
      }

      // Return a user-friendly error
      return throwError(() => ({
        message: errorMessage,
        status: error.status,
        originalError: error,
      }));
    })
  );
};

