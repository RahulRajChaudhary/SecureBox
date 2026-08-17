import { Router } from 'express';
import { register, login, refresh, logout } from '../controllers/auth.controller.js';
import { asyncHandler } from '../lib/asyncHandler.js';

export const authRouter = Router();

authRouter.post('/register', asyncHandler(register));
authRouter.post('/login', asyncHandler(login));
authRouter.post('/refresh', asyncHandler(refresh));
authRouter.post('/logout', asyncHandler(logout));
