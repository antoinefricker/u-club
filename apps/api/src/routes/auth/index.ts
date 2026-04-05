import { Router } from 'express';
import forgotPasswordRouter from './forgotPassword.js';
import loginRouter from './login.js';
import logoutRouter from './logout.js';
import magicLinkRouter from './magicLink.js';
import magicLinkVerifyRouter from './magicLinkVerify.js';
import resetPasswordRouter from './resetPassword.js';
import verifyEmailRouter from './verifyEmail.js';
import verifyEmailResendRouter from './verifyEmailResend.js';

const router = Router();

router.use(forgotPasswordRouter);
router.use(loginRouter);
router.use(logoutRouter);
router.use(magicLinkRouter);
router.use(magicLinkVerifyRouter);
router.use(resetPasswordRouter);
router.use(verifyEmailRouter);
router.use(verifyEmailResendRouter);

export default router;
