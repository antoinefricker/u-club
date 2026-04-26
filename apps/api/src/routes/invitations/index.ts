import { Router } from 'express';
import listRouter from './list.js';
import listSentRouter from './listSent.js';
import createRouter from './create.js';
import acceptRouter from './accept.js';
import deleteRouter from './delete.js';
import getByTokenRouter from './getByToken.js';
import registerAndAcceptRouter from './registerAndAccept.js';

const router = Router();

router.use(getByTokenRouter);
router.use(registerAndAcceptRouter);
router.use(listSentRouter);
router.use(listRouter);
router.use(createRouter);
router.use(acceptRouter);
router.use(deleteRouter);

export default router;
