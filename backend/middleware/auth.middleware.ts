import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../utils/AppError';
import { env } from '../config/env';
import { JWTPayload, RequestUser } from '../types';

// Extend Express Request interface to include user
declare global {
    namespace Express {
        interface Request {
            user?: RequestUser;
        }
    }
}

const auth = (req: Request, res: Response, next: NextFunction) => {
    let token = '';

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return next(new AppError('You are not logged in! Please log in to get access.', 401));
    }

    try {
        const decoded = jwt.verify(token, env.jwtSecret) as JWTPayload;
        
        // Validate decoded token structure
        if (!decoded.userId || !decoded.tenantId || !decoded.role) {
            return next(new AppError('Invalid token structure. Please log in again!', 401));
        }

        req.user = {
            userId: decoded.userId,
            tenantId: decoded.tenantId,
            role: decoded.role,
        };
        
        next();
    } catch (err) {
        if (err instanceof jwt.TokenExpiredError) {
            return next(new AppError('Your token has expired! Please log in again.', 401));
        }
        if (err instanceof jwt.JsonWebTokenError) {
            return next(new AppError('Invalid token. Please log in again!', 401));
        }
        return next(new AppError('Authentication failed. Please log in again!', 401));
    }
};

export default auth;
