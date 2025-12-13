import express, { Router } from 'express';
import { login, register } from '../controllers/auth.controller';
import validate from '../middleware/validation.middleware';
import { authSchema } from '../utils/schemas';

const router: Router = express.Router();

router.post('/login', validate(authSchema.login), login);
router.post('/register', register);

export default router;
