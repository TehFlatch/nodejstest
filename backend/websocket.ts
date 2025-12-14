import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { logger } from './utils/logger';
import { eventBus, EVENTS } from './utils/events';
import { env } from './config/env';
import { JWTPayload } from './types';

// Extended Socket interface with custom properties
interface AuthenticatedSocket extends Socket {
    userId?: string;
    tenantId?: string;
    role?: string;
}

export class WebSocketServer {
    private io: SocketIOServer;

    constructor(httpServer: HttpServer) {
        this.io = new SocketIOServer(httpServer, {
            cors: {
                origin: "*", // Adjust for production
                methods: ["GET", "POST"]
            }
        });

        // Add authentication middleware
        this.io.use(this.authenticateSocket.bind(this));

        this.setupConnection();
        this.setupEventListeners();
    }

    private authenticateSocket(socket: AuthenticatedSocket, next: (err?: Error) => void) {
        try {
            // Get token from handshake auth or query
            const token = socket.handshake.auth?.token || 
                         socket.handshake.query?.token as string;

            if (!token) {
                logger.warn(`Socket connection rejected: No token provided (${socket.id})`);
                return next(new Error('Authentication required'));
            }

            // Verify JWT token
            const decoded = jwt.verify(token, env.jwtSecret) as JWTPayload;

            // Validate token structure
            if (!decoded.userId || !decoded.tenantId || !decoded.role) {
                logger.warn(`Socket connection rejected: Invalid token structure (${socket.id})`);
                return next(new Error('Invalid token structure'));
            }

            // Check if user is admin
            if (decoded.role !== 'admin') {
                logger.warn(`Socket connection rejected: User is not admin (${socket.id}, role: ${decoded.role})`);
                return next(new Error('Only admin users can connect to real-time events'));
            }

            // Attach user info to socket
            socket.userId = decoded.userId;
            socket.tenantId = decoded.tenantId;
            socket.role = decoded.role;

            logger.info(`Socket authenticated: ${socket.id} (user: ${decoded.userId}, tenant: ${decoded.tenantId}, role: ${decoded.role})`);
            next();
        } catch (err) {
            if (err instanceof jwt.TokenExpiredError) {
                logger.warn(`Socket connection rejected: Token expired (${socket.id})`);
                return next(new Error('Token expired'));
            }
            if (err instanceof jwt.JsonWebTokenError) {
                logger.warn(`Socket connection rejected: Invalid token (${socket.id})`);
                return next(new Error('Invalid token'));
            }
            logger.error(`Socket authentication error: ${err instanceof Error ? err.message : String(err)}`);
            return next(new Error('Authentication failed'));
        }
    }

    private setupConnection() {
        this.io.on('connection', (socket) => {
            // Cast to AuthenticatedSocket since middleware has already authenticated
            const authSocket = socket as AuthenticatedSocket;
            
            // Use tenantId from authenticated socket
            const tenantId = authSocket.tenantId || authSocket.handshake.query.tenantId as string;
            
            logger.info(`Socket connected: ${authSocket.id} (user: ${authSocket.userId}, tenant: ${tenantId}, role: ${authSocket.role})`);

            // Join tenant room
            if (tenantId) {
                authSocket.join(`tenant:${tenantId}`);
                logger.info(`Socket ${authSocket.id} joined tenant:${tenantId}`);
            }

            authSocket.on('disconnect', () => {
                logger.info(`Socket disconnected: ${authSocket.id}`);
            });
        });
    }

    private setupEventListeners() {
        // Project Events
        eventBus.on(EVENTS.PROJECT.CREATED, (data) => {
            logger.info(`Broadcasting ${EVENTS.PROJECT.CREATED} to tenant: ${data.tenantId}`);
            this.broadcastToTenant(data.tenantId, EVENTS.PROJECT.CREATED, data);
        });

        eventBus.on(EVENTS.PROJECT.UPDATED, (data) => {
            logger.info(`Broadcasting ${EVENTS.PROJECT.UPDATED} to tenant: ${data.tenantId}`);
            this.broadcastToTenant(data.tenantId, EVENTS.PROJECT.UPDATED, data);
        });

        eventBus.on(EVENTS.PROJECT.DELETED, (data) => {
            logger.info(`Broadcasting ${EVENTS.PROJECT.DELETED} to tenant: ${data.tenantId}`);
            this.broadcastToTenant(data.tenantId, EVENTS.PROJECT.DELETED, data);
        });

        // Task Events
        eventBus.on(EVENTS.TASK.CREATED, (data) => {
            logger.info(`Broadcasting ${EVENTS.TASK.CREATED} to tenant: ${data.tenantId}`);
            this.broadcastToTenant(data.tenantId, EVENTS.TASK.CREATED, data);
        });

        eventBus.on(EVENTS.TASK.UPDATED, (data) => {
            logger.info(`Broadcasting ${EVENTS.TASK.UPDATED} to tenant: ${data.tenantId}`);
            this.broadcastToTenant(data.tenantId, EVENTS.TASK.UPDATED, data);
        });

        eventBus.on(EVENTS.TASK.DELETED, (data) => {
            logger.info(`Broadcasting ${EVENTS.TASK.DELETED} to tenant: ${data.tenantId}`);
            this.broadcastToTenant(data.tenantId, EVENTS.TASK.DELETED, data);
        });
    }

    private broadcastToTenant(tenantId: string | null, event: string, data: any) {
        if (tenantId) {
            const room = `tenant:${tenantId}`;
            const clientsInRoom = this.io.sockets.adapter.rooms.get(room);
            const clientCount = clientsInRoom ? clientsInRoom.size : 0;
            logger.info(`Broadcasting to room ${room} (${clientCount} clients)`);
            this.io.to(room).emit(event, data);
        } else {
            // Global broadcast if no tenant (legacy)
            logger.info(`Broadcasting globally: ${event}`);
            this.io.emit(event, data);
        }
    }
}

let wsServer: WebSocketServer;

export const initWebSocket = (server: HttpServer) => {
    wsServer = new WebSocketServer(server);
    return wsServer;
};
