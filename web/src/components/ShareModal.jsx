import { motion } from 'framer-motion';
import { Globe, Link2, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { backdropFade, scaleIn, quick } from '../lib/motion';

export function ShareModal({ name, shareSlug, isPublic, isUpdating, onToggle, onClose, kind = 'file' }) {
  const basePath = kind === 'folder' ? '/share/folder' : '/share';

  async function handleCopy() {
    const url = `${window.location.origin}${basePath}/${shareSlug}`;
    await navigator.clipboard.writeText(url);
    toast.success('Share link copied');
  }

  return (
    <motion.div
      variants={backdropFade}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={quick}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    >
      <motion.div
        variants={scaleIn}
        transition={quick}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-lg border border-edge bg-surface p-5 shadow-2xl"
      >
        <h2 className="mb-3 truncate text-sm font-semibold text-ink">
          Share <span className="font-mono">{name}</span>
        </h2>

        <div className="flex items-center justify-between rounded-md border border-edge px-3 py-2">
          <span className="flex items-center gap-2 text-sm text-ink">
            {isPublic ? <Globe size={15} className="text-warn" /> : <Lock size={15} className="text-muted" />}
            {isPublic ? 'Anyone with the link' : 'Only you'}
          </span>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onToggle}
            disabled={isUpdating}
            className="rounded-md px-3 py-1.5 text-sm font-medium text-accent transition-colors hover:bg-surface2 disabled:opacity-50"
          >
            {isPublic ? 'Make private' : 'Make public'}
          </motion.button>
        </div>

        {isPublic && shareSlug && (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleCopy}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-md bg-accent px-3 py-2 text-sm font-medium text-bg transition-colors hover:bg-accent-dim"
          >
            <Link2 size={14} /> Copy share link
          </motion.button>
        )}

        <div className="mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-md px-3 py-1.5 text-sm text-muted transition-colors hover:bg-surface2 hover:text-ink"
          >
            Done
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
