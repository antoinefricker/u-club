import { Router } from 'express';
import emailLoginRouter from './emailLogin.js';
import emailTokenRouter from './emailToken.js';

const router = Router();

router.use(emailLoginRouter);
router.use(emailTokenRouter);

export default router;
