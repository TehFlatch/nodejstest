import { Request, Response, NextFunction } from 'express';
import { ZodType } from 'zod';
import { AppError } from '../utils/AppError';

const validate = (schema: ZodType<any>) => (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
        const errorMessages = result.error.issues.map(err => err.message).join(', ');
        return next(new AppError(errorMessages, 400));
    }

    req.body = result.data;
    next();
};

export default validate;
