import { motion } from 'framer-motion';
import { Folder, FolderInput } from 'lucide-react';
import { Breadcrumb } from './Breadcrumb';
import { backdropFade, scaleIn, quick } from '../lib/motion';

export function MoveModal({ title, targetId, onTargetChange, folders, isLoading, atCurrentLocation, isMoving, onMove, onClose }) {
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
        className="flex w-full max-w-sm flex-col gap-3 rounded-lg border border-edge bg-surface p-5 shadow-2xl"
      >
        <h2 className="text-sm font-semibold text-ink">
          Move <span className="font-mono">{title}</span>
        </h2>

        <Breadcrumb folderId={targetId} onNavigate={onTargetChange} />

        <div className="max-h-64 overflow-y-auto rounded-md border border-edge">
          {isLoading ? (
            <p className="p-3 text-center text-xs text-muted">Loading…</p>
          ) : folders.length === 0 ? (
            <p className="p-3 text-center text-xs text-muted">No subfolders here.</p>
          ) : (
            folders.map((folder) => (
              <button
                key={folder.id}
                onClick={() => onTargetChange(folder.id)}
                className="flex w-full items-center gap-2 border-b border-edge px-3 py-2 text-left text-sm text-ink last:border-b-0 hover:bg-surface2"
              >
                <Folder size={15} className="shrink-0 text-accent" />
                <span className="truncate font-mono">{folder.name}</span>
              </button>
            ))
          )}
        </div>

        <div className="mt-1 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-3 py-1.5 text-sm text-muted transition-colors hover:bg-surface2 hover:text-ink"
          >
            Cancel
          </button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onMove}
            disabled={atCurrentLocation || isMoving}
            className="flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-bg transition-colors hover:bg-accent-dim disabled:opacity-50"
          >
            <FolderInput size={14} />
            {isMoving ? 'Moving…' : 'Move here'}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
