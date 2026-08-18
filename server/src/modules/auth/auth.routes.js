import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { env } from '../../config/env.js';
import { LOGIN_RATE_LIMIT, REFRESH_RATE_LIMIT } from '../../config/rateLimits.js';
import * as authController from './auth.controller.js';

export const authRouter = Router();

const loginLimiter = rateLimit({
  ...LOGIN_RATE_LIMIT,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => env.NODE_ENV === 'test',
});

const refreshLimiter = rateLimit({
  ...REFRESH_RATE_LIMIT,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => env.NODE_ENV === 'test',
});

authRouter.post('/register', loginLimiter, asyncHandler(authController.register));
authRouter.post('/login', loginLimiter, asyncHandler(authController.login));
authRouter.post('/refresh', refreshLimiter, asyncHandler(authController.refresh));
authRouter.post('/logout', asyncHandler(authController.logout));
