import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';
import { rateLimit } from 'express-rate-limit';
import { env } from './config/env.js';
import { authRouter } from './routes/auth.routes.js';
import { filesRouter } from './modules/files/files.routes.js';
import { foldersRouter } from './modules/folders/folders.routes.js';
import { shareRouter } from './modules/share/share.routes.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

export const app = express();

app.use(helmet());
const allowedOrigins = env.CORS_ORIGIN.split(',').map((origin) => origin.trim());
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());
app.use(cookieParser(env.COOKIE_SECRET));
app.use(
  pinoHttp({
    redact: ['req.headers.authorization', 'req.headers.cookie'],
    level: env.NODE_ENV === 'test' ? 'silent' : 'info',
  }),
);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => env.NODE_ENV === 'test',
});
app.use('/api/auth', authLimiter, authRouter);
app.use('/api/files', filesRouter);
app.use('/api/folders', foldersRouter);
app.use('/api/share', shareRouter);

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use(notFound);
app.use(errorHandler);
