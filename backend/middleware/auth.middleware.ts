import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';

// Extend Express Request interface to include user
declare global {
    namespace Express {
        interface Request {
            user?: any; // Replace 'any' with specific User interface if available later
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

    // Verify token (Simulation)
    if (token === 'fake-jwt-token') {
        req.user = { id: 1, name: 'Test User', role: 'admin' };
        next();
    } else {
        return next(new AppError('Invalid token. Please log in again!', 401));
    }
};

export default auth;
