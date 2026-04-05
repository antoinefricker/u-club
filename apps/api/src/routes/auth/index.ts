import { Router } from 'express';
import confirmEmailRouter from './confirmEmail.js';
import emailLoginRouter from './emailLogin.js';
import emailTokenRouter from './emailToken.js';
import forgotPasswordRouter from './forgotPassword.js';
import loginRouter from './login.js';
import logoutRouter from './logout.js';
import resendConfirmationRouter from './resendConfirmation.js';
import resetPasswordRouter from './resetPassword.js';

const router = Router();

router.use(confirmEmailRouter);
router.use(emailLoginRouter);
router.use(emailTokenRouter);
router.use(forgotPasswordRouter);
router.use(loginRouter);
router.use(logoutRouter);
router.use(resendConfirmationRouter);
router.use(resetPasswordRouter);

export default router;
