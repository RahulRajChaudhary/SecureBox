import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { UploadManager } from '../lib/uploadManager';
import { useUploadStore, managers } from '../lib/uploadStore';

export function useUploadFiles(folderId) {
  const addUpload = useUploadStore((s) => s.addUpload);
  const updateUpload = useUploadStore((s) => s.updateUpload);
  const queryClient = useQueryClient();

  return useCallback(
    (fileList) => {
      Array.from(fileList).forEach((file) => {
        const id = addUpload(file);
        const manager = new UploadManager(file, {
          folderId,
          onProgress: (uploadedBytes, totalBytes) => updateUpload(id, { uploadedBytes, totalBytes }),
          onStatusChange: (status, extra) => {
            updateUpload(id, { status });
            if (status === 'done') {
              queryClient.invalidateQueries({ queryKey: ['files'] });
              queryClient.invalidateQueries({ queryKey: ['usage'] });
              toast.success(`${file.name} uploaded`);
            }
            if (status === 'error') {
              updateUpload(id, { error: extra?.message ?? 'Upload failed' });
              toast.error(`${file.name} failed to upload`);
            }
          },
        });
        managers.set(id, manager);
        manager.start().catch(() => {
          updateUpload(id, { status: 'error', error: 'Could not start upload' });
          toast.error(`${file.name} failed to upload`);
        });
      });
    },
    [addUpload, updateUpload, queryClient, folderId],
  );
}
