import { Router } from 'express';
import confirmEmailRouter from './confirmEmail.js';
import emailLoginRouter from './emailLogin.js';
import emailTokenRouter from './emailToken.js';
import loginRouter from './login.js';
import logoutRouter from './logout.js';
import resendConfirmationRouter from './resendConfirmation.js';

const router = Router();

router.use(confirmEmailRouter);
router.use(emailLoginRouter);
router.use(emailTokenRouter);
router.use(loginRouter);
router.use(logoutRouter);
router.use(resendConfirmationRouter);

export default router;
