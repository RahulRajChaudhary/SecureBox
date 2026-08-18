import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Download, Eye, Globe, Lock, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatBytes } from '../lib/format';
import { downloadFile } from '../lib/files';
import { getFileIcon } from '../lib/fileIcon';
import { useUpdateFile, useDeleteFile } from '../hooks/useFiles';
import { RenameModal } from './RenameModal';
import { DeleteConfirm } from './DeleteConfirm';
import { CopyLinkButton } from './CopyLinkButton';
import { PreviewModal } from './PreviewModal';
import { row, scaleIn, springy, quick } from '../lib/motion';

export function FileCard({ file }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const menuRef = useRef(null);
  const updateFile = useUpdateFile();
  const deleteFile = useDeleteFile();

  const isPublic = file.visibility === 'PUBLIC';
  const Icon = getFileIcon(file.mimeType);

  useEffect(() => {
    if (!menuOpen) return;
    function handlePointer(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    function handleKey(e) {
      if (e.key === 'Escape') setMenuOpen(false);
    }
    document.addEventListener('mousedown', handlePointer);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handlePointer);
      document.removeEventListener('keydown', handleKey);
    };
  }, [menuOpen]);

  async function handleDownload() {
    try {
      await downloadFile(file.id);
    } catch {
      toast.error('Download failed');
    }
  }

  function toggleVisibility() {
    updateFile.mutate(
      { fileId: file.id, patch: { visibility: isPublic ? 'PRIVATE' : 'PUBLIC' } },
      { onError: () => toast.error('Could not change visibility') },
    );
  }

  function handleRename(name) {
    updateFile.mutate(
      { fileId: file.id, patch: { name } },
      {
        onSuccess: () => setRenaming(false),
        onError: () => toast.error('Rename failed'),
      },
    );
  }

  function handleDelete() {
    deleteFile.mutate(file.id, {
      onSuccess: () => toast.success('File deleted'),
      onError: () => toast.error('Delete failed'),
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
        <p className="font-mono text-xs text-muted">{formatBytes(file.sizeBytes)}</p>
      </div>

      <button
        onClick={toggleVisibility}
        disabled={updateFile.isPending}
        className={`flex items-center gap-1 rounded-md p-2 text-xs transition-colors hover:bg-surface2 sm:px-2 sm:py-1 ${
          isPublic ? 'text-warn' : 'text-muted'
        }`}
        title={isPublic ? 'Public — click to make private' : 'Private — click to make public'}
      >
        {isPublic ? <Globe size={14} /> : <Lock size={14} />}
        <span className="hidden sm:inline">{isPublic ? 'Public' : 'Private'}</span>
      </button>

      {isPublic && file.shareSlug && <CopyLinkButton slug={file.shareSlug} />}

      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={() => setPreviewing(true)}
        className="rounded-md p-2 text-muted transition-colors hover:bg-surface2 hover:text-ink sm:p-1.5"
        title="Preview"
      >
        <Eye size={16} />
      </motion.button>

      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={handleDownload}
        className="rounded-md p-2 text-muted transition-colors hover:bg-surface2 hover:text-ink sm:p-1.5"
        title="Download"
      >
        <Download size={16} />
      </motion.button>

      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="rounded-md p-2 text-muted transition-colors hover:bg-surface2 hover:text-ink sm:p-1.5"
        >
          <MoreVertical size={16} />
        </button>
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              variants={scaleIn}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={quick}
              style={{ transformOrigin: 'top right' }}
              className="absolute right-0 z-10 mt-1 w-36 rounded-md border border-edge bg-surface2 py-1 shadow-xl"
            >
              <button
                onClick={() => {
                  setRenaming(true);
                  setMenuOpen(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-muted hover:bg-surface hover:text-ink"
              >
                <Pencil size={14} /> Rename
              </button>
              <button
                onClick={() => {
                  setDeleting(true);
                  setMenuOpen(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-red-400 hover:bg-red-500/10"
              >
                <Trash2 size={14} /> Delete
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {renaming && (
          <RenameModal
            initialName={file.originalName}
            onSave={handleRename}
            onClose={() => setRenaming(false)}
            saving={updateFile.isPending}
          />
        )}
        {deleting && (
          <DeleteConfirm
            name={file.originalName}
            onConfirm={handleDelete}
            onClose={() => setDeleting(false)}
            deleting={deleteFile.isPending}
          />
        )}
        {previewing && <PreviewModal file={file} onClose={() => setPreviewing(false)} />}
      </AnimatePresence>
    </motion.div>
  );
}
