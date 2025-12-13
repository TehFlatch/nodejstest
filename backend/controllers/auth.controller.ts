import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import prisma from '../config/prisma';

export const register = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password, name, tenantName } = req.body;

        if (!email || !password || !tenantName) {
            return next(new AppError('Please provide email, password, and tenant name!', 400));
        }

        // Transaction to ensure atomicity
        const result = await prisma.$transaction(async (tx) => {
            // Create Tenant
            const tenant = await tx.tenant.create({
                data: {
                    name: tenantName,
                    slug: tenantName.toLowerCase().replace(/\s+/g, '-'),
                }
            });

            // Create User
            const user = await tx.user.create({
                data: {
                    email,
                    password, // In real app, hash this!
                    name,
                    role: 'admin',
                    tenantId: tenant.id
                }
            });

            return { tenant, user };
        });

        res.status(201).json({
            status: 'success',
            data: {
                user: result.user,
                tenant: result.tenant
            }
        });
    } catch (err: any) {
        if (err.code === 'P2002') { // Unique constraint violation
            return next(new AppError('Email or Tenant Slug already exists', 400));
        }
        next(new AppError('Error registering user', 500));
    }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return next(new AppError('Please provide email and password!', 400));
        }

        const user = await prisma.user.findUnique({
            where: { email },
            include: { tenant: true }
        });

        if (!user || user.password !== password) {
            return next(new AppError('Incorrect email or password', 401));
        }

        // Generate token (mocked)
        const token = 'fake-jwt-token-for-' + user.id;

        res.status(200).json({
            status: 'success',
            token,
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    tenantId: user.tenantId,
                    tenantName: user.tenant?.name
                }
            }
        });
    } catch (err) {
        next(new AppError('Error logging in', 500));
    }
};
