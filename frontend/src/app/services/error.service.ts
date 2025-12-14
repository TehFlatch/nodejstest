import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface ErrorNotification {
  message: string;
  type: 'error' | 'warning' | 'info';
  timestamp: Date;
  id: string;
}

@Injectable({
  providedIn: 'root'
})
export class ErrorService {
  private errorsSubject = new BehaviorSubject<ErrorNotification[]>([]);
  public errors$ = this.errorsSubject.asObservable();

  showError(message: string, type: 'error' | 'warning' | 'info' = 'error'): void {
    const error: ErrorNotification = {
      message,
      type,
      timestamp: new Date(),
      id: `${Date.now()}-${Math.random()}`,
    };

    const currentErrors = this.errorsSubject.value;
    this.errorsSubject.next([...currentErrors, error]);

    // Auto-remove after 5 seconds for errors, 3 seconds for others
    const timeout = type === 'error' ? 5000 : 3000;
    setTimeout(() => {
      this.removeError(error.id);
    }, timeout);
  }

  removeError(id: string): void {
    const currentErrors = this.errorsSubject.value.filter(e => e.id !== id);
    this.errorsSubject.next(currentErrors);
  }

  clearAll(): void {
    this.errorsSubject.next([]);
  }

  getErrors(): ErrorNotification[] {
    return this.errorsSubject.value;
  }
}

