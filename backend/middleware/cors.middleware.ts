import { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { env } from '../config/env';

const corsOptions: cors.CorsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) {
            return callback(null, true);
        }

        const allowedOrigins = env.corsOrigin.split(',').map(o => o.trim());
        
        if (allowedOrigins.includes(origin) || env.nodeEnv === 'development') {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-tenant-id'],
    exposedHeaders: ['x-request-id'],
    maxAge: 86400, // 24 hours
};

export const corsMiddleware = cors(corsOptions);

