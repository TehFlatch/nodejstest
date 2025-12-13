import { z } from 'zod';

export const projectSchema = {
    create: z.object({
        title: z.string().min(1, 'Title is required'),
        description: z.string().optional().or(z.literal('')),
        status: z.enum(['active', 'completed', 'archived']).default('active')
    })
};

export const taskSchema = {
    create: z.object({
        title: z.string().min(1, 'Title is required'),
        description: z.string().optional().or(z.literal('')),
        status: z.enum(['todo', 'in-progress', 'done']).default('todo'),
        dueDate: z.string().datetime().optional(),
        projectId: z.number().int().positive()
    }),
    update: z.object({
        title: z.string().min(1).optional(),
        description: z.string().optional().or(z.literal('')),
        status: z.enum(['todo', 'in-progress', 'done']).optional(),
        dueDate: z.string().datetime().optional()
    })
};

export const authSchema = {
    login: z.object({
        username: z.string().min(1, 'Username is required'),
        password: z.string().min(1, 'Password is required')
    })
};
