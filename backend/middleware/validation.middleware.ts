import { Request, Response, NextFunction } from 'express';
import { ZodType, ZodSchema } from 'zod';
import { AppError } from '../utils/AppError';

interface ValidationSchemas {
    body?: ZodSchema;
    query?: ZodSchema;
    params?: ZodSchema;
}

const validate = (schemas: ValidationSchemas | ZodType) => {
    return (req: Request, res: Response, next: NextFunction) => {
        // Support legacy single schema (body only)
        if ('safeParse' in schemas) {
            const result = (schemas as ZodType).safeParse(req.body);
            if (!result.success) {
                const errorMessages = result.error.issues.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
                return next(new AppError(`Validation error: ${errorMessages}`, 400));
            }
            req.body = result.data;
            return next();
        }

        // New multi-schema validation
        const validationSchemas = schemas as ValidationSchemas;
        const errors: string[] = [];

        // Validate body
        if (validationSchemas.body) {
            const result = validationSchemas.body.safeParse(req.body);
            if (!result.success) {
                errors.push(...result.error.issues.map(err => `body.${err.path.join('.')}: ${err.message}`));
            } else {
                req.body = result.data;
            }
        }

        // Validate query
        if (validationSchemas.query) {
            const result = validationSchemas.query.safeParse(req.query);
            if (!result.success) {
                errors.push(...result.error.issues.map(err => `query.${err.path.join('.')}: ${err.message}`));
            } else {
                req.query = result.data as typeof req.query;
            }
        }

        // Validate params
        if (validationSchemas.params) {
            const result = validationSchemas.params.safeParse(req.params);
            if (!result.success) {
                errors.push(...result.error.issues.map(err => `params.${err.path.join('.')}: ${err.message}`));
            } else {
                req.params = result.data as typeof req.params;
            }
        }

        if (errors.length > 0) {
            return next(new AppError(`Validation error: ${errors.join(', ')}`, 400));
        }

        next();
    };
};

export default validate;
