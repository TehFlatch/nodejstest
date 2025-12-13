import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import prisma from '../config/prisma';

// Extend Express Request interface
declare global {
    namespace Express {
        interface Request {
            tenantId?: string;
        }
    }
}

export const tenantMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    const tenantIdHeader = req.headers['x-tenant-id'];

    if (!tenantIdHeader) {
        // Allow public access or fallback to default tenant for now
        // return next(new AppError('x-tenant-id header missing', 400));
        return next();
    }

    const tenantId = Array.isArray(tenantIdHeader) ? tenantIdHeader[0] : tenantIdHeader;

    // Optional: Verify tenant exists in DB to be strict
    // const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    // if (!tenant) return next(new AppError('Invalid Tenant ID', 400));

    req.tenantId = tenantId;
    next();
};
