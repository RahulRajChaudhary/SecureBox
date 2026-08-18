import { motion } from 'framer-motion';
import { backdropFade, scaleIn, quick } from '../lib/motion';

export function DeleteConfirm({ name, onConfirm, onClose, deleting, title = 'Delete file', message }) {
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
        <h2 className="mb-2 text-sm font-semibold text-ink">{title}</h2>
        <p className="text-sm text-muted">
          {message ?? (
            <>
              Delete <span className="font-mono font-medium text-ink">{name}</span>? This can't be
              undone.
            </>
          )}
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-md px-3 py-1.5 text-sm text-muted transition-colors hover:bg-surface2 hover:text-ink"
          >
            Cancel
          </button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onConfirm}
            disabled={deleting}
            className="rounded-md bg-red-500 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-red-400 disabled:opacity-50"
          >
            {deleting ? 'Deleting…' : 'Delete'}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
