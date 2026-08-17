import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler.js';
import * as shareController from './share.controller.js';

export const shareRouter = Router();

shareRouter.get('/:slug', asyncHandler(shareController.getMeta));
shareRouter.get('/:slug/download', asyncHandler(shareController.download));
