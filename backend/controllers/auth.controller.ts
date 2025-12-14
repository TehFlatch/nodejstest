import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AppError } from '../utils/AppError';
import prisma from '../config/prisma';
import { env } from '../config/env';
import { logger } from '../utils/logger';

export const register = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password, name, tenantName } = req.body;

        if (!email || !password || !tenantName) {
            return next(new AppError('Please provide email, password, and tenant name!', 400));
        }

        // Transaction to ensure atomicity
        const hashedPassword = await bcrypt.hash(password, 10);
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
                    password: hashedPassword,
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
    } catch (err: unknown) {
        if (err && typeof err === 'object' && 'code' in err && err.code === 'P2002') {
            // Unique constraint violation
            return next(new AppError('Email or Tenant Slug already exists', 400));
        }
        logger.error('Error registering user', err as Error);
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

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return next(new AppError('Incorrect email or password', 401));
        }

        // Generate JWT token
        // Type assertion needed because StringValue from 'ms' package is more specific than string
        const token = jwt.sign(
            { userId: user.id, tenantId: user.tenantId, role: user.role },
            env.jwtSecret,
            { expiresIn: env.jwtExpiresIn as any }
        );
        
        logger.info('User logged in successfully', { userId: user.id, email: user.email });

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
        logger.error('Error logging in', err as Error);
        next(new AppError('Error logging in', 500));
    }
};
