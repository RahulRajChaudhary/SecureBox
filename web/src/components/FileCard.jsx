import { AnimatePresence, motion } from 'framer-motion';
import { Download, Eye, FolderInput, Globe, Info, MoreVertical, Pencil, Share2, Trash2 } from 'lucide-react';
import { formatBytes } from '../lib/format';
import { useFileActions } from '../hooks/useFileActions';
import { FileActionModals } from './FileActionModals';
import { row, scaleIn, springy, quick } from '../lib/motion';

export function FileCard({ file, isFirst = false, isLast = false }) {
  const actions = useFileActions(file);
  const {
    menuOpen, setMenuOpen, menuRef,
    isPublic, Icon,
    handleDownload,
    setRenaming, setDeleting, setPreviewing, setMoving,
    setViewingInfo, setSharing,
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
      <Icon size={18} className="shrink-0 text-muted" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-mono text-sm font-medium text-ink">{file.originalName}</p>
        <p className="font-mono text-xs text-muted">{formatBytes(file.sizeBytes)}</p>
      </div>

      {isPublic && <Globe size={14} className="shrink-0 text-warn" title="Public" />}

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

      <FileActionModals file={file} actions={actions} />
    </motion.div>
  );
}
