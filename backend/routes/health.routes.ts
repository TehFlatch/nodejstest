import { Router, Request, Response } from 'express';
import prisma from '../config/prisma';
import { logger } from '../utils/logger';
import { env } from '../config/env';

const router = Router();

router.get('/health', async (req: Request, res: Response) => {
    const healthCheck: {
        status: string;
        timestamp: string;
        uptime: number;
        environment: string;
        version: string;
        database?: string;
    } = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: env.nodeEnv,
        version: process.env.npm_package_version || '1.0.0',
    };

    try {
        // Check database connection
        await prisma.$queryRaw`SELECT 1`;
        healthCheck.database = 'connected';
    } catch (error) {
        logger.error('Database health check failed', error as Error);
        healthCheck.database = 'disconnected';
        healthCheck.status = 'degraded';
    }

    const statusCode = healthCheck.status === 'ok' ? 200 : 503;
    res.status(statusCode).json(healthCheck);
});

export default router;

