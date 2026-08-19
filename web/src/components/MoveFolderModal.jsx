import { useState } from 'react';
import { motion } from 'framer-motion';
import { Folder, FolderInput } from 'lucide-react';
import toast from 'react-hot-toast';
import { useFolders, useUpdateFolder } from '../hooks/useFolders';
import { Breadcrumb } from './Breadcrumb';
import { backdropFade, scaleIn, quick } from '../lib/motion';

export function MoveFolderModal({ folder, onClose }) {
  const [targetId, setTargetId] = useState(folder.parentId ?? null);
  const { data, isLoading } = useFolders(targetId);
  // Never offer the folder being moved (or anything reachable only through
  // it) as a destination — filtering it out of every level's listing means
  // its subtree is simply unreachable via this UI.
  const subfolders = (data?.data ?? []).filter((f) => f.id !== folder.id);
  const updateFolder = useUpdateFolder();

  const atCurrentLocation = targetId === (folder.parentId ?? null);

  function handleMove() {
    updateFolder.mutate(
      { folderId: folder.id, patch: { parentId: targetId } },
      {
        onSuccess: () => {
          toast.success('Folder moved');
          onClose();
        },
        onError: (err) =>
          toast.error(err.status === 409 ? 'Cannot move a folder into itself or its own subfolder' : 'Move failed'),
      },
    );
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
        className="flex w-full max-w-sm flex-col gap-3 rounded-lg border border-edge bg-surface p-5 shadow-2xl"
      >
        <h2 className="text-sm font-semibold text-ink">
          Move <span className="font-mono">{folder.name}</span>
        </h2>

        <Breadcrumb folderId={targetId} onNavigate={setTargetId} />

        <div className="max-h-64 overflow-y-auto rounded-md border border-edge">
          {isLoading ? (
            <p className="p-3 text-center text-xs text-muted">Loading…</p>
          ) : subfolders.length === 0 ? (
            <p className="p-3 text-center text-xs text-muted">No subfolders here.</p>
          ) : (
            subfolders.map((sub) => (
              <button
                key={sub.id}
                onClick={() => setTargetId(sub.id)}
                className="flex w-full items-center gap-2 border-b border-edge px-3 py-2 text-left text-sm text-ink last:border-b-0 hover:bg-surface2"
              >
                <Folder size={15} className="shrink-0 text-accent" />
                <span className="truncate font-mono">{sub.name}</span>
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
            onClick={handleMove}
            disabled={atCurrentLocation || updateFolder.isPending}
            className="flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-bg transition-colors hover:bg-accent-dim disabled:opacity-50"
          >
            <FolderInput size={14} />
            {updateFolder.isPending ? 'Moving…' : 'Move here'}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
