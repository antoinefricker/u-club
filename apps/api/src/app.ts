import express from 'express';
import healthRouter from './routes/health.js';
import authRouter from './routes/auth/index.js';
import usersRouter from './routes/users/index.js';

const app = express();

app.use(express.json());

app.use(healthRouter);
app.use('/auth', authRouter);
app.use('/users', usersRouter);

export default app;
