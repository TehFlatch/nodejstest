import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';

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
        // Ensure the error is logged to console (use console.log per requirement)
        console.log('ERROR 💥', err);
        res.status(500).json({
            status: 'error',
            message: 'Something went very wrong!'
        });
    }
};

const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    // Always log every error to the console so backend error visibility is guaranteed
    try {
        console.log('Global error handler caught error:', err);
    } catch (loggingErr) {
        // In case logging itself fails, fall back to a safe console output
        // (avoid throwing from the error handler)
        // eslint-disable-next-line no-console
        console.log('Error while logging error:', loggingErr);
    }
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    // In a real app, use process.env.NODE_ENV
    const env = 'development';

    if (env === 'development') {
        sendErrorDev(err, res);
    } else {
        sendErrorProd(err, res);
    }
};

export default errorHandler;
