import { AnimatePresence, motion } from 'framer-motion';
import { Folder, FolderInput, Globe, Info, MoreVertical, Pencil, Share2, Trash2 } from 'lucide-react';
import { useFolderActions } from '../hooks/useFolderActions';
import { FolderActionModals } from './FolderActionModals';
import { row, scaleIn, springy, quick } from '../lib/motion';

export function FolderRow({ folder, onOpen, isFirst = false, isLast = false }) {
  const actions = useFolderActions(folder);
  const {
    menuOpen, setMenuOpen, menuRef,
    isPublic,
    setRenaming, setDeleting, setMoving, setViewingInfo, setSharing,
  } = actions;

  return (
    <motion.div
      layout
      variants={row}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={springy}
      className={`relative flex items-center gap-2 border-b border-edge px-4 py-3 last:border-b-0 hover:bg-surface2 sm:gap-3 ${
        isFirst ? 'rounded-t-lg' : ''
      } ${isLast ? 'z-40 rounded-b-lg' : ''}`}
    >
      <button onClick={() => onOpen(folder.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
        <Folder size={18} className="shrink-0 text-accent" />
        <p className="truncate font-mono text-sm font-medium text-ink">{folder.name}</p>
      </button>

      {isPublic && <Globe size={14} className="shrink-0 text-warn" title="Public" />}

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
              style={{ transformOrigin: isLast ? 'bottom right' : 'top right' }}
              className={`absolute right-0 w-36 rounded-md border border-edge bg-surface2 py-1 shadow-xl ${
                isLast ? 'bottom-full z-40 mb-1' : 'z-10 mt-1'
              }`}
            >
              <button
                onClick={() => {
                  setViewingInfo(true);
                  setMenuOpen(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-muted hover:bg-surface hover:text-ink"
              >
                <Info size={14} /> Info
              </button>
              <button
                onClick={() => {
                  setSharing(true);
                  setMenuOpen(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-muted hover:bg-surface hover:text-ink"
              >
                <Share2 size={14} /> Share
              </button>
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
                  setMoving(true);
                  setMenuOpen(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-muted hover:bg-surface hover:text-ink"
              >
                <FolderInput size={14} /> Move to
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

      <FolderActionModals folder={folder} actions={actions} />
    </motion.div>
  );
}
