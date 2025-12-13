import { Injectable, signal } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class LoadingService {
    private loadingSignal = signal<boolean>(false);
    private requestCount = 0;

    readonly isLoading = this.loadingSignal.asReadonly();

    show(): void {
        this.requestCount++;
        this.loadingSignal.set(true);
    }

    hide(): void {
        this.requestCount = Math.max(0, this.requestCount - 1);
        if (this.requestCount === 0) {
            this.loadingSignal.set(false);
        }
    }
}
