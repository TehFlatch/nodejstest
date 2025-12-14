import { User, Tenant } from '@prisma/client';

export interface JWTPayload {
    userId: string;
    tenantId: string;
    role: string;
    iat?: number;
    exp?: number;
}

export interface AuthenticatedUser extends User {
    tenant: Tenant;
}

export interface RequestUser {
    userId: string;
    tenantId: string;
    role: string;
}

