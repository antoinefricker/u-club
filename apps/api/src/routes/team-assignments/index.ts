import { Router } from 'express';
import listRouter from './list.js';

const router = Router();

router.use(listRouter);

export default router;
