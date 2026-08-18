import { CronJob } from 'cron';
import { prisma } from '../lib/prisma.js';
import * as filesRepo from '../modules/files/files.repository.js';
import { abortMultipartUpload, deleteObject } from '../services/upload.service.js';
import { UPLOAD_EXPIRY_DAYS, TRASH_RETENTION_DAYS } from '../config/upload.constants.js';
import { logger } from '../lib/logger.js';

// Postgres and S3 can't share a transaction, so this is what keeps them
// eventually consistent for the two ways they can diverge.

export function startReconciler() {
  return new CronJob(
    '0 * * * *', // hourly
    async () => {
      await reconcileStaleUploads();
      await reconcileDeletedFiles();
    },
    null,
    true,
  );
}

async function reconcileStaleUploads() {
  const stale = await filesRepo.findStalePendingFiles(UPLOAD_EXPIRY_DAYS);
  for (const file of stale) {
    try {
      if (file.uploadId) {
        await abortMultipartUpload({ storageKey: file.storageKey, uploadId: file.uploadId });
      }
      await filesRepo.updateFile(file.id, file.ownerId, { status: 'FAILED', uploadId: null });
      logger.info({ fileId: file.id }, 'Reconciler: aborted stale upload');
    } catch (err) {
      logger.error({ fileId: file.id, err }, 'Reconciler: failed to abort stale upload');
    }
  }
}

async function reconcileDeletedFiles() {
  const deleting = await filesRepo.findDeletingFiles(TRASH_RETENTION_DAYS);
  for (const file of deleting) {
    try {
      await deleteObject({ storageKey: file.storageKey });
      await prisma.file.delete({ where: { id: file.id } });
      logger.info({ fileId: file.id }, 'Reconciler: purged deleted file');
    } catch (err) {
      logger.error({ fileId: file.id, err }, 'Reconciler: failed to purge file');
    }
  }
}

export { reconcileStaleUploads, reconcileDeletedFiles };
