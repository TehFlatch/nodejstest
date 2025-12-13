import express, { Request, Response, NextFunction } from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import cluster from 'cluster';
import os from 'os';
import { createServer } from 'http';
import globalErrorHandler from './middleware/error.middleware';
import { AppError } from './utils/AppError';
import { logger } from './utils/logger';
import prisma from './config/prisma';
import { initWebSocket } from './websocket';
import { initQueues } from './workers/queue';
import { tenantMiddleware } from './middleware/tenant.middleware';

// Routes Import
import projectRoutes from './routes/project.routes';
import taskRoutes from './routes/task.routes';
import authRoutes from './routes/auth.routes';
import adminRoutes from './routes/admin.routes';

// Global process-level logging to ensure every runtime error is visible in console
process.on('uncaughtException', (err: any) => {
    console.log('uncaughtException:', err);
});

process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    console.log('unhandledRejection:', reason);
});

const numCPUs = os.cpus().length;

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
    const app = express();
    const PORT = process.env.PORT || 3000;

    // Create HTTP Server for WebSocket integration
    const httpServer = createServer(app);

    // Initialize Services
    initWebSocket(httpServer);
    initQueues();

    app.use(cors());
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));

    // Global Middleware
    app.use(tenantMiddleware);

    // Database
    prisma.$connect()
        .then(() => logger.info(`[Worker ${process.pid}] Database connected...`))
        .catch((err: any) => logger.error('Error: ' + err));

    // Routes
    app.use('/api/auth', authRoutes);
    app.use('/api/projects', projectRoutes);
    app.use('/api/tasks', taskRoutes);
    app.use('/api/admin', adminRoutes);

    app.get('/', (req: Request, res: Response) => {
        res.send(`API Running on Worker ${process.pid}`);
    });

    // Unhandled Routes
    app.all('*', (req: Request, res: Response, next: NextFunction) => {
        next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
    });

    // Global Error Handler
    app.use(globalErrorHandler);

    // Listen on httpServer, not app
    httpServer.listen(PORT, () => {
        logger.info(`Worker ${process.pid} started on port ${PORT}`);
    });
}
