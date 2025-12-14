import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { logger } from '../utils/logger';
import { env } from '../config/env';

const sendErrorDev = (err: AppError, res: Response) => {
    res.status(err.statusCode).json({
        status: err.status,
        error: err,
        message: err.message,
        stack: err.stack
    });
};

const sendErrorProd = (err: AppError, res: Response) => {
    if (err.isOperational) {
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message
        });
    } else {
        // Log the error with structured logging
        logger.error('Unexpected error occurred', err, {
            statusCode: err.statusCode,
            message: err.message
        });
        
        res.status(500).json({
            status: 'error',
            message: 'Something went very wrong!'
        });
    }
};

const errorHandler = (err: unknown, req: Request, res: Response, next: NextFunction) => {
    // Convert unknown errors to AppError
    let appError: AppError;
    
    if (err instanceof AppError) {
        appError = err;
    } else if (err instanceof Error) {
        appError = new AppError(err.message, 500);
        appError.stack = err.stack;
    } else {
        appError = new AppError('An unknown error occurred', 500);
    }

    // Always log every error
    logger.error('Error caught by global handler', appError, {
        path: req.path,
        method: req.method,
        statusCode: appError.statusCode,
    });

    appError.statusCode = appError.statusCode || 500;
    appError.status = appError.status || 'error';

    if (env.nodeEnv === 'development') {
        sendErrorDev(appError, res);
    } else {
        sendErrorProd(appError, res);
    }
};

export default errorHandler;
