import express from 'express';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './swagger.js';
import healthRouter from './routes/health.js';
import authRouter from './routes/auth/index.js';
import usersRouter from './routes/users/index.js';
import clubsRouter from './routes/clubs/index.js';
import teamsRouter from './routes/teams/index.js';
import memberStatusesRouter from './routes/member-statuses/index.js';
import membersRouter from './routes/members/index.js';
import userMembersRouter from './routes/user-members/index.js';
import invitationsRouter from './routes/invitations/index.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

app.use(express.json());

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(healthRouter);
app.use('/auth', authRouter);
app.use('/users', usersRouter);
app.use('/clubs', clubsRouter);
app.use('/teams', teamsRouter);
app.use('/member-statuses', memberStatusesRouter);
app.use('/members', membersRouter);
app.use('/user-members', userMembersRouter);
app.use('/invitations', invitationsRouter);

app.use(errorHandler);

export default app;
