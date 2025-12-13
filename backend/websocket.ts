import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import { logger } from './utils/logger';
import { eventBus, EVENTS } from './utils/events';

export class WebSocketServer {
    private io: SocketIOServer;

    constructor(httpServer: HttpServer) {
        this.io = new SocketIOServer(httpServer, {
            cors: {
                origin: "*", // Adjust for production
                methods: ["GET", "POST"]
            }
        });

        this.setupConnection();
        this.setupEventListeners();
    }

    private setupConnection() {
        this.io.on('connection', (socket) => {
            logger.info(`Socket connected: ${socket.id}`);

            // Join tenant room if provided
            const tenantId = socket.handshake.query.tenantId as string;
            if (tenantId) {
                socket.join(`tenant:${tenantId}`);
                logger.info(`Socket ${socket.id} joined tenant:${tenantId}`);
            }

            socket.on('disconnect', () => {
                logger.info(`Socket disconnected: ${socket.id}`);
            });
        });
    }

    private setupEventListeners() {
        // Project Events
        eventBus.on(EVENTS.PROJECT.CREATED, (data) => {
            this.broadcastToTenant(data.tenantId, EVENTS.PROJECT.CREATED, data);
        });

        eventBus.on(EVENTS.PROJECT.UPDATED, (data) => {
            this.broadcastToTenant(data.tenantId, EVENTS.PROJECT.UPDATED, data);
        });

        // Task Events
        eventBus.on(EVENTS.TASK.CREATED, (data) => {
            this.broadcastToTenant(data.tenantId, EVENTS.TASK.CREATED, data);
        });
    }

    private broadcastToTenant(tenantId: string | null, event: string, data: any) {
        if (tenantId) {
            this.io.to(`tenant:${tenantId}`).emit(event, data);
        } else {
            // Global broadcast if no tenant (legacy)
            this.io.emit(event, data);
        }
    }
}

let wsServer: WebSocketServer;

export const initWebSocket = (server: HttpServer) => {
    wsServer = new WebSocketServer(server);
    return wsServer;
};
