import express, { Router } from 'express';
import auth from '../middleware/auth.middleware';
import validate from '../middleware/validation.middleware';
import { taskSchema } from '../utils/schemas';
import { getAllTasks, createTask, updateTask, deleteTask, getTasksByProject } from '../controllers/task.controller';

const router: Router = express.Router();

// Protect routes
router.use(auth);

// Routes
router.route('/')
    .get(getAllTasks)
    .post(validate(taskSchema.create), createTask);

router.route('/:id')
    .put(validate(taskSchema.update), updateTask)
    .delete(deleteTask);

router.get('/project/:projectId', getTasksByProject);

export default router;
