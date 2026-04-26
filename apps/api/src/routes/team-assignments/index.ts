import { Router } from 'express';
import listRouter from './list.js';
import createRouter from './create.js';
import updateRouter from './update.js';

const router = Router();

router.use(listRouter);
router.use(createRouter);
router.use(updateRouter);

export default router;
