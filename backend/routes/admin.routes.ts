import express, { Router } from 'express';
import auth from '../middleware/auth.middleware';
import * as adminController from '../controllers/admin.controller';

const router: Router = express.Router();

router.use(auth);

router.get('/block-event-loop', adminController.blockEventLoop);
router.get('/heavy-computation', adminController.runHeavyComputation);

export default router;
