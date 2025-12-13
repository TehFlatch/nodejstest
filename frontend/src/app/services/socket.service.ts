import { Injectable, OnDestroy, signal } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, Subject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class SocketService implements OnDestroy {
    private socket: Socket;
    private url = 'http://localhost:3000'; // Environment config in real app

    // Connection State
    public connected = signal<boolean>(false);

    constructor() {
        this.socket = io(this.url, {
            autoConnect: false,
            transports: ['websocket']
        });

        this.setupListeners();
    }

    connect(tenantId?: string) {
        if (tenantId) {
            this.socket.io.opts.query = { tenantId };
        }
        this.socket.connect();
    }

    disconnect() {
        this.socket.disconnect();
    }

    private setupListeners() {
        this.socket.on('connect', () => {
            console.log('Socket Connected');
            this.connected.set(true);
        });

        this.socket.on('disconnect', () => {
            console.log('Socket Disconnected');
            this.connected.set(false);
        });

        this.socket.on('connect_error', (err) => {
            console.error('Socket Connection Error:', err);
        });
    }

    // Generic Event Listener
    onEvent<T>(eventName: string): Observable<T> {
        return new Observable<T>(observer => {
            this.socket.on(eventName, (data: T) => {
                observer.next(data);
            });

            return () => {
                this.socket.off(eventName);
            };
        });
    }

    ngOnDestroy() {
        this.disconnect();
    }
}
