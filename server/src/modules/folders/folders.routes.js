import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth.js';
import { asyncHandler } from '../../lib/asyncHandler.js';
import * as foldersController from './folders.controller.js';

export const foldersRouter = Router();

foldersRouter.use(requireAuth);

foldersRouter.post('/', asyncHandler(foldersController.create));
foldersRouter.get('/', asyncHandler(foldersController.list));
// Must come before /:id — otherwise "favorites" is parsed as a folder id.
foldersRouter.get('/favorites', asyncHandler(foldersController.favorites));
foldersRouter.get('/:id', asyncHandler(foldersController.get));
foldersRouter.patch('/:id', asyncHandler(foldersController.update));
foldersRouter.delete('/:id', asyncHandler(foldersController.remove));
