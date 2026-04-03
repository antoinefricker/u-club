import { Router } from 'express';
import emailLoginRouter from './emailLogin.js';

const router = Router();

router.use(emailLoginRouter);

export default router;
