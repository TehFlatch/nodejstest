import { Request, Response, NextFunction } from 'express';
import { Worker } from 'worker_threads';
import path from 'path';
import { AppError } from '../utils/AppError';

export const blockEventLoop = (req: Request, res: Response) => {
    const start = Date.now();
    // Purposefully blocking the event loop
    while (Date.now() - start < 5000) { }
    res.send('Event loop unblocked after 5 seconds');
};

export const runHeavyComputation = (req: Request, res: Response, next: NextFunction) => {
    const worker = new Worker(path.join(__dirname, '../workers/heavy-computation.ts'), { // Note: worker script should also be .ts if we run via ts-node, or compiled .js
        workerData: { limit: 1000000000 }
    });

    worker.on('message', (result) => {
        res.status(200).json({ status: 'success', data: result });
    });

    worker.on('error', (err) => {
        next(new AppError('Worker thread failed', 500));
    });

    worker.on('exit', (code) => {
        if (code !== 0) next(new AppError(`Worker stopped with exit code ${code}`, 500));
    });
};
