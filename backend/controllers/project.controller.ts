import { Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import { AppError } from '../utils/AppError';
import { eventBus, EVENTS } from '../utils/events';

export const getAllProjects = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tenantId = req.tenantId; // Might be undefined
        const whereClause = tenantId ? { tenantId } : {};

        const projects = await prisma.project.findMany({
            where: whereClause
        });

        res.status(200).json({
            status: 'success',
            results: projects.length,
            data: { projects }
        });
    } catch (err) {
        console.log(err);
        next(new AppError('Error fetching projects', 500));
    }
};

export const createProject = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { title, description, status } = req.body;
        const tenantId = req.tenantId;

        const newProject = await prisma.project.create({
            data: {
                title,
                description,
                status: status || 'active',
                tenantId: tenantId || null
            }
        });

        eventBus.emit(EVENTS.PROJECT.CREATED, {
            project: newProject,
            tenantId
        });

        res.status(201).json({
            status: 'success',
            data: { project: newProject }
        });
    } catch (err) {
        next(new AppError('Error creating project', 500));
    }
};

export const getProjectById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tenantId = req.tenantId;
        const project = await prisma.project.findFirst({
            where: {
                id: Number(req.params.id),
                ...(tenantId ? { tenantId } : {})
            }
        });

        if (!project) {
            return next(new AppError('No project found with that ID', 404));
        }

        res.status(200).json({
            status: 'success',
            data: { project }
        });
    } catch (err) {
        next(new AppError('Error fetching project', 500));
    }
};

export const deleteProject = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tenantId = req.tenantId;

        // precise delete with tenant check
        const project = await prisma.project.findFirst({
            where: {
                id: Number(req.params.id),
                ...(tenantId ? { tenantId } : {})
            }
        });

        if (!project) {
            return next(new AppError('No project found with that ID', 404));
        }

        await prisma.project.delete({
            where: { id: Number(req.params.id) }
        });

        eventBus.emit(EVENTS.PROJECT.DELETED, {
            projectId: Number(req.params.id),
            tenantId
        });

        res.status(204).json({
            status: 'success',
            data: null
        });
    } catch (err: any) {
        next(new AppError('Error deleting project', 500));
    }
};

