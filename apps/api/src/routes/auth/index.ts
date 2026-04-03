import { Router } from 'express';
import emailLoginRouter from './emailLogin.js';
import emailTokenRouter from './emailToken.js';
import loginRouter from './login.js';
import logoutRouter from './logout.js';

const router = Router();

router.use(emailLoginRouter);
router.use(emailTokenRouter);
router.use(loginRouter);
router.use(logoutRouter);

export default router;
