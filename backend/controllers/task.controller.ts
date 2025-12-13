import { Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import { AppError } from '../utils/AppError';
import { eventBus, EVENTS } from '../utils/events';
import { notificationQueue } from '../workers/queue';

export const getAllTasks = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tenantId = req.tenantId;
        const tasks = await prisma.task.findMany({
            where: tenantId ? { tenantId } : {}
        });
        res.status(200).json({
            status: 'success',
            results: tasks.length,
            data: { tasks }
        });
    } catch (err) {
        next(new AppError('Error fetching tasks', 500));
    }
};

export const createTask = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { title, description, status, dueDate, projectId } = req.body;
        const tenantId = req.tenantId;

        const newTask = await prisma.task.create({
            data: {
                title,
                description,
                status: status || 'todo',
                dueDate: dueDate ? new Date(dueDate) : null,
                projectId: projectId ? Number(projectId) : null,
                tenantId: tenantId || null
            }
        });

        // Emit Event
        eventBus.emit(EVENTS.TASK.CREATED, { task: newTask, tenantId });

        // Add to Queue (Mock background job)
        notificationQueue.add({
            email: 'admin@test.com',
            taskId: newTask.id
        });

        res.status(201).json({
            status: 'success',
            data: { task: newTask }
        });
    } catch (err) {
        next(new AppError('Error creating task', 500));
    }
};

export const updateTask = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { title, description, status, dueDate } = req.body;
        const tenantId = req.tenantId;

        // Verify ownership
        const existingTask = await prisma.task.findFirst({
            where: { id: Number(req.params.id), ...(tenantId ? { tenantId } : {}) }
        });

        if (!existingTask) {
            return next(new AppError('No task found with that ID', 404));
        }

        const updatedTask = await prisma.task.update({
            where: { id: Number(req.params.id) },
            data: {
                title,
                description,
                status,
                dueDate: dueDate ? new Date(dueDate) : undefined
            }
        });

        eventBus.emit(EVENTS.TASK.UPDATED, { task: updatedTask, tenantId });

        res.status(200).json({
            status: 'success',
            data: { task: updatedTask }
        });
    } catch (err) {
        next(new AppError('Error updating task', 500));
    }
};

export const deleteTask = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tenantId = req.tenantId;

        const existingTask = await prisma.task.findFirst({
            where: { id: Number(req.params.id), ...(tenantId ? { tenantId } : {}) }
        });

        if (!existingTask) {
            return next(new AppError('No task found with that ID', 404));
        }

        await prisma.task.delete({
            where: { id: Number(req.params.id) }
        });

        eventBus.emit(EVENTS.TASK.DELETED, { taskId: Number(req.params.id), tenantId });

        res.status(204).json({
            status: 'success',
            data: null
        });
    } catch (err: any) {
        next(new AppError('Error deleting task', 500));
    }
};

export const getTasksByProject = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tenantId = req.tenantId;
        const tasks = await prisma.task.findMany({
            where: {
                projectId: Number(req.params.projectId),
                ...(tenantId ? { tenantId } : {})
            }
        });
        res.status(200).json({
            status: 'success',
            results: tasks.length,
            data: { tasks }
        });
    } catch (err) {
        next(new AppError('Error fetching project tasks', 500));
    }
};

