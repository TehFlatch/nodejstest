import express, { Request, Response, NextFunction } from 'express';
import bodyParser from 'body-parser';
import cluster from 'cluster';
import os from 'os';
import { createServer } from 'http';
import globalErrorHandler from './middleware/error.middleware';
import { AppError } from './utils/AppError';
import { logger } from './utils/logger';
import { env } from './config/env';
import prisma from './config/prisma';
import { initWebSocket } from './websocket';
import { initQueues } from './workers/queue';
import { tenantMiddleware } from './middleware/tenant.middleware';
import { securityHeaders, apiLimiter } from './middleware/security.middleware';
import { corsMiddleware } from './middleware/cors.middleware';

// Routes Import
import projectRoutes from './routes/project.routes';
import taskRoutes from './routes/task.routes';
import authRoutes from './routes/auth.routes';
import adminRoutes from './routes/admin.routes';
import healthRoutes from './routes/health.routes';

// Global process-level error handlers
process.on('uncaughtException', (err: Error) => {
    logger.error('Uncaught Exception', err);
    // Give time for logging before exit
    setTimeout(() => {
        process.exit(1);
    }, 1000);
});

process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
    logger.error('Unhandled Rejection', reason instanceof Error ? reason : new Error(String(reason)), {
        promise: String(promise)
    });
});

const numCPUs = os.cpus().length;

// Comment out clustering for single worker mode
/*
if (cluster.isPrimary) {
    logger.info(`Master ${process.pid} is running`);

    // Fork workers.
    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }

    cluster.on('exit', (worker, code, signal) => {
        logger.warn(`worker ${worker.process.pid} died`);
        cluster.fork();
    });
} else {
*/
    const app = express();
    const PORT = env.port;

    // Create HTTP Server for WebSocket integration
    const httpServer = createServer(app);

    // Trust proxy (for rate limiting behind reverse proxy)
    app.set('trust proxy', 1);

    // Security Middleware (must be first)
    app.use(securityHeaders);
    app.use(corsMiddleware);

    // Body parsing middleware
    app.use(bodyParser.json({ limit: '10mb' }));
    app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

    // Rate limiting (apply to all routes except health)
    app.use('/api', apiLimiter);

    // Health check (before other routes)
    app.use('/api', healthRoutes);

    // Initialize Services
    initWebSocket(httpServer);
    initQueues();

    // Global Middleware
    app.use(tenantMiddleware);

    // Database connection with retry logic
    const connectDatabase = async () => {
        try {
            await prisma.$connect();
            logger.info('Database connected successfully', { workerId: process.pid });
        } catch (err) {
            logger.error('Database connection failed', err as Error);
            // In production, you might want to retry or exit
            if (env.nodeEnv === 'production') {
                process.exit(1);
            }
        }
    };
    
    connectDatabase();

    // Routes
    app.use('/api/auth', authRoutes);
    app.use('/api/projects', projectRoutes);
    app.use('/api/tasks', taskRoutes);
    app.use('/admin', adminRoutes);

    app.get('/', (req: Request, res: Response) => {
        res.send(`API Running on Worker ${process.pid}`);
    });

    // Unhandled Routes
    app.all('*', (req: Request, res: Response, next: NextFunction) => {
        next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
    });

    // Global Error Handler
    app.use(globalErrorHandler);

    // Graceful shutdown handler
    const gracefulShutdown = async (signal: string) => {
        logger.info(`${signal} received. Starting graceful shutdown...`);
        
        httpServer.close(async () => {
            logger.info('HTTP server closed');
            
            try {
                await prisma.$disconnect();
                logger.info('Database connection closed');
                process.exit(0);
            } catch (err) {
                logger.error('Error during shutdown', err as Error);
                process.exit(1);
            }
        });

        // Force shutdown after 10 seconds
        setTimeout(() => {
            logger.warn('Forcing shutdown after timeout');
            process.exit(1);
        }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Listen on httpServer, not app
    httpServer.listen(PORT, () => {
        logger.info('Server started successfully', {
            port: PORT,
            environment: env.nodeEnv,
            workerId: process.pid
        });
    });
/*
}
*/
