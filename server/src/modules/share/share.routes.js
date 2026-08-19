import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler.js';
import * as shareController from './share.controller.js';
import * as shareFolderController from './share.folder.controller.js';

export const shareRouter = Router();

shareRouter.get('/:slug', asyncHandler(shareController.getMeta));
shareRouter.get('/:slug/download', asyncHandler(shareController.download));

shareRouter.get('/folder/:slug', asyncHandler(shareFolderController.getRoot));
shareRouter.get('/folder/:slug/browse/:folderId', asyncHandler(shareFolderController.browse));
shareRouter.get('/folder/:slug/files/:fileId/download', asyncHandler(shareFolderController.downloadFile));
