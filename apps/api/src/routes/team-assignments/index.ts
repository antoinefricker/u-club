import { Router } from 'express';
import listRouter from './list.js';
import createRouter from './create.js';

const router = Router();

router.use(listRouter);
router.use(createRouter);

export default router;
