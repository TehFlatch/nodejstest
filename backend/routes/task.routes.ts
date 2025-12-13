import express, { Router } from 'express';
import auth from '../middleware/auth.middleware';
import * as taskController from '../controllers/task.controller';
import validate from '../middleware/validation.middleware';
import { taskSchema } from '../utils/schemas';

const router: Router = express.Router();

// Protect routes
router.use(auth);

// Routes
router.route('/')
    .get(taskController.getAllTasks)
    .post(validate(taskSchema.create), taskController.createTask);

router.route('/:id')
    .put(validate(taskSchema.update), taskController.updateTask)
    .delete(taskController.deleteTask);

router.get('/project/:projectId', taskController.getTasksByProject);

export default router;
