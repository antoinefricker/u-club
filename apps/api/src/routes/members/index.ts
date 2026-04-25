import { Router } from 'express';
import listRouter from './list.js';
import getRouter from './get.js';
import teamsRouter from './teams.js';
import createRouter from './create.js';
import updateRouter from './update.js';
import deleteRouter from './delete.js';

const router = Router();

router.use(listRouter);
router.use(getRouter);
router.use(teamsRouter);
router.use(createRouter);
router.use(updateRouter);
router.use(deleteRouter);

export default router;
