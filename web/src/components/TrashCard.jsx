import { motion } from 'framer-motion';
import { RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatBytes } from '../lib/format';
import { getFileIcon } from '../lib/fileIcon';
import { useRestoreFile } from '../hooks/useFiles';
import { row, springy } from '../lib/motion';

function formatDeletedAt(deletedAt) {
  return new Date(deletedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function TrashCard({ file }) {
  const restoreFile = useRestoreFile();
  const Icon = getFileIcon(file.mimeType);

  function handleRestore() {
    restoreFile.mutate(file.id, {
      onSuccess: () => toast.success('File restored'),
      onError: () => toast.error('Restore failed'),
    });
  }

  return (
    <motion.div
      layout
      variants={row}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={springy}
      className="flex items-center gap-2 border-b border-edge px-4 py-3 last:border-b-0 hover:bg-surface2 sm:gap-3"
    >
      <Icon size={18} className="shrink-0 text-muted" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-mono text-sm font-medium text-ink">{file.originalName}</p>
        <p className="font-mono text-xs text-muted">
          {formatBytes(file.sizeBytes)} · Deleted {formatDeletedAt(file.deletedAt)}
        </p>
      </div>

      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={handleRestore}
        disabled={restoreFile.isPending}
        className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-muted transition-colors hover:bg-surface2 hover:text-ink disabled:opacity-50"
        title="Restore"
      >
        <RotateCcw size={14} />
        <span className="hidden sm:inline">Restore</span>
      </motion.button>
    </motion.div>
  );
}
