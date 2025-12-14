import express, { Router } from 'express';
import { login, register } from '../controllers/auth.controller';
import validate from '../middleware/validation.middleware';
import { authSchema } from '../utils/schemas';
import { authLimiter } from '../middleware/security.middleware';

const router: Router = express.Router();

// Apply stricter rate limiting to auth endpoints
router.post('/login', authLimiter, validate(authSchema.login), login);
router.post('/register', authLimiter, register);

export default router;
