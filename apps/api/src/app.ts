import express from 'express';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './swagger.js';
import { camelToSnake, snakeToCamel } from './middleware/caseConverter.js';
import healthRouter from './routes/health.js';
import authRouter from './routes/auth/index.js';
import usersRouter from './routes/users/index.js';

const app = express();

app.use(express.json());
app.use(camelToSnake);
app.use(snakeToCamel);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(healthRouter);
app.use('/auth', authRouter);
app.use('/users', usersRouter);

export default app;
