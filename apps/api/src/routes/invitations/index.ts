import { Router } from 'express';
import listReceivedRouter from './listReceived.js';
import listSentRouter from './listSent.js';
import createRouter from './create.js';
import acceptRouter from './accept.js';
import deleteRouter from './delete.js';
import getByTokenRouter from './getByToken.js';

const router = Router();

router.use(getByTokenRouter);
router.use(listSentRouter);
router.use(listReceivedRouter);
router.use(createRouter);
router.use(acceptRouter);
router.use(deleteRouter);

export default router;
