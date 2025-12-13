import express, { Router } from 'express';
import auth from '../middleware/auth.middleware';
import * as projectController from '../controllers/project.controller';
import validate from '../middleware/validation.middleware';
import { projectSchema } from '../utils/schemas';

const router: Router = express.Router();

// Protect all routes
router.use(auth);

// Routes
router.route('/')
    .get(projectController.getAllProjects)
    .post(validate(projectSchema.create), projectController.createProject);

router.route('/:id')
    .get(projectController.getProjectById)
    .delete(projectController.deleteProject);

export default router;
