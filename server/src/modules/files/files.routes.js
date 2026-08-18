import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth.js';
import { asyncHandler } from '../../lib/asyncHandler.js';
import * as filesController from './files.controller.js';

export const filesRouter = Router();

filesRouter.use(requireAuth);

filesRouter.post('/upload-intent', asyncHandler(filesController.createIntent));
filesRouter.get('/:id/upload-status', asyncHandler(filesController.uploadStatus));
filesRouter.post('/:id/resume', asyncHandler(filesController.resume));
filesRouter.post('/:id/complete', asyncHandler(filesController.complete));
filesRouter.post('/:id/abort', asyncHandler(filesController.abort));
filesRouter.get('/', asyncHandler(filesController.list));
filesRouter.get('/trash', asyncHandler(filesController.trash));
filesRouter.patch('/:id', asyncHandler(filesController.update));
filesRouter.delete('/:id', asyncHandler(filesController.remove));
filesRouter.post('/:id/restore', asyncHandler(filesController.restore));
filesRouter.get('/:id/download', asyncHandler(filesController.download));
filesRouter.get('/:id/preview-url', asyncHandler(filesController.previewUrl));
filesRouter.get('/:id/preview/zip-contents', asyncHandler(filesController.zipContents));
