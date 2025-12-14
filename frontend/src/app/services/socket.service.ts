import { Injectable, OnDestroy, signal, inject } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({
    providedIn: 'root'
})
export class SocketService implements OnDestroy {
    private socket: Socket | null = null;
    private url = environment.wsUrl;
    private currentTenantId: string | null = null;
    private authService = inject(AuthService);

    // Connection State
    public connected = signal<boolean>(false);

    constructor() {
        // Don't create socket immediately - wait for connect() call
    }

    connect(tenantId?: string) {
        // Only allow connection for admin users
        if (!this.authService.isAdmin()) {
            console.warn('Socket connection denied: User is not an admin');
            return;
        }

        // Get JWT token
        const token = this.authService.getToken();
        if (!token) {
            console.warn('Socket connection denied: No authentication token');
            return;
        }

        // Disconnect existing socket if connected
        if (this.socket) {
            this.socket.removeAllListeners();
            this.socket.disconnect();
            this.socket = null;
        }

        // Store tenantId
        this.currentTenantId = tenantId || null;

        // Create new socket with tenantId in query and token in auth
        const query: any = {};
        if (tenantId) {
            query.tenantId = tenantId;
        }

        this.socket = io(this.url, {
            autoConnect: true,
            transports: ['websocket'],
            query,
            auth: {
                token: token
            }
        });

        this.setupListeners();
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
        this.currentTenantId = null;
    }

    private setupListeners() {
        if (!this.socket) return;

        this.socket.on('connect', () => {
            console.log('Socket Connected', this.currentTenantId ? `(tenant: ${this.currentTenantId})` : '');
            this.connected.set(true);
        });

        this.socket.on('disconnect', () => {
            console.log('Socket Disconnected');
            this.connected.set(false);
        });

        this.socket.on('connect_error', (err) => {
            console.error('Socket Connection Error:', err.message || err);
            this.connected.set(false);
        });
    }

    // Generic Event Listener
    onEvent<T>(eventName: string): Observable<T> {
        return new Observable<T>(observer => {
            if (!this.socket) {
                console.warn('Socket not connected. Cannot listen to event:', eventName);
                return;
            }

            const handler = (data: T) => {
                console.log(`Event received: ${eventName}`, data);
                observer.next(data);
            };

            this.socket.on(eventName, handler);

            return () => {
                if (this.socket) {
                    this.socket.off(eventName, handler);
                }
            };
        });
    }

    ngOnDestroy() {
        this.disconnect();
    }
}
