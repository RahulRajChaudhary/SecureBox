import { useCallback, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { UploadCloud } from 'lucide-react';
import toast from 'react-hot-toast';
import { UploadManager } from '../lib/uploadManager';
import { useUploadStore, managers } from '../lib/uploadStore';

export function UploadZone({ folderId = null }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);
  const addUpload = useUploadStore((s) => s.addUpload);
  const updateUpload = useUploadStore((s) => s.updateUpload);
  const queryClient = useQueryClient();

  const startUpload = useCallback(
    (file) => {
      const id = addUpload(file);
      const manager = new UploadManager(file, {
        folderId,
        onProgress: (uploadedBytes, totalBytes) => updateUpload(id, { uploadedBytes, totalBytes }),
        onStatusChange: (status, extra) => {
          updateUpload(id, { status });
          if (status === 'done') {
            queryClient.invalidateQueries({ queryKey: ['files'] });
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
    },
    [addUpload, updateUpload, queryClient, folderId],
  );

  function handleFiles(fileList) {
    Array.from(fileList).forEach(startUpload);
  }

  return (
    <motion.div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        handleFiles(e.dataTransfer.files);
      }}
      onClick={() => inputRef.current?.click()}
      animate={{ scale: dragging ? 1.01 : 1 }}
      transition={{ duration: 0.15 }}
      className={`flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors ${
        dragging ? 'border-accent bg-accent/5' : 'border-edge bg-surface hover:border-muted'
      }`}
    >
      <motion.div
        animate={dragging ? { y: -4 } : { y: [0, -5, 0] }}
        transition={dragging ? { duration: 0.15 } : { duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <UploadCloud size={28} className={dragging ? 'text-accent' : 'text-muted'} />
      </motion.div>
      <p className="text-sm text-ink">Drop a file here, or click to browse</p>
      <p className="font-mono text-xs text-muted">Up to 5 GB</p>
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = '';
        }}
      />
    </motion.div>
  );
}
