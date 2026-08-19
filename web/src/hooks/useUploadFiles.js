import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { UploadManager } from '../lib/uploadManager';
import { useUploadStore, managers } from '../lib/uploadStore';
import { createFolder } from '../lib/folders';
import { hasFolderPath, dirPath, uniqueDirPaths } from '../lib/folderUpload';

const DONE_AUTO_DISMISS_MS = 3000;

export function useUploadFiles(folderId) {
  const addUpload = useUploadStore((s) => s.addUpload);
  const updateUpload = useUploadStore((s) => s.updateUpload);
  const removeUpload = useUploadStore((s) => s.removeUpload);
  const queryClient = useQueryClient();

  const startUpload = useCallback(
    (file, targetFolderId) => {
      const id = addUpload(file);
      const manager = new UploadManager(file, {
        folderId: targetFolderId,
        onProgress: (uploadedBytes, totalBytes) => updateUpload(id, { uploadedBytes, totalBytes }),
        onStatusChange: (status, extra) => {
          updateUpload(id, { status });
          if (status === 'done') {
            queryClient.invalidateQueries({ queryKey: ['files'] });
            queryClient.invalidateQueries({ queryKey: ['usage'] });
            queryClient.invalidateQueries({ queryKey: ['stats'] });
            toast.success(`${file.name} uploaded`);
            setTimeout(() => removeUpload(id), DONE_AUTO_DISMISS_MS);
          }
          if (status === 'error') {
            updateUpload(id, { error: extra?.message ?? 'Upload failed' });
            toast.error(`${file.name} failed to upload`);
          }
        },
      });
      managers.set(id, manager);
      manager.start().catch((err) => {
        const message =
          err?.code === 'QUOTA_EXCEEDED' ? 'Storage limit reached — free up space or delete files' : 'Could not start upload';
        updateUpload(id, { status: 'error', error: message });
        toast.error(message);
      });
    },
    [addUpload, updateUpload, removeUpload, queryClient],
  );

  return useCallback(
    async (fileList) => {
      const files = Array.from(fileList);
      const flatFiles = files.filter((f) => !hasFolderPath(f));
      const folderFiles = files.filter(hasFolderPath);

      flatFiles.forEach((file) => startUpload(file, folderId));

      if (folderFiles.length === 0) return;

      const pathToFolderId = new Map([['', folderId]]);
      for (const path of uniqueDirPaths(folderFiles)) {
        const parentPath = dirPath(path);
        const name = path.split('/').pop();
        try {
          const res = await createFolder({ name, parentId: pathToFolderId.get(parentPath) ?? null });
          pathToFolderId.set(path, res.data.id);
        } catch {
          toast.error(`Could not create folder "${name}"`);
          return;
        }
      }
      queryClient.invalidateQueries({ queryKey: ['folders'] });

      folderFiles.forEach((file) => {
        const targetId = pathToFolderId.get(dirPath(file.webkitRelativePath));
        startUpload(file, targetId);
      });
    },
    [startUpload, folderId, queryClient],
  );
}
