import { AnimatePresence, motion } from 'framer-motion';
import { Download, FolderInput, Globe, Info, MoreVertical, Pencil, Share2, Trash2 } from 'lucide-react';
import { formatBytes } from '../lib/format';
import { useFileActions } from '../hooks/useFileActions';
import { FileActionModals } from './FileActionModals';
import { FileThumbnail } from './FileThumbnail';
import { scaleIn, springy, quick } from '../lib/motion';

export function FileGridCard({ file }) {
  const actions = useFileActions(file);
  const {
    menuOpen, setMenuOpen, menuRef,
    isPublic,
    handleDownload,
    setRenaming, setDeleting, setMoving, setPreviewing,
    setViewingInfo, setSharing,
  } = actions;

  return (
    <motion.div
      layout
      variants={scaleIn}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={springy}
      className="group relative flex flex-col rounded-lg border border-edge bg-surface hover:bg-surface2"
    >
      <button
        onClick={() => setPreviewing(true)}
        className="block aspect-[4/3] w-full overflow-hidden rounded-t-lg"
      >
        <FileThumbnail file={file} />
      </button>

      <div className="flex flex-col gap-1 px-3 py-2">
        <p className="w-full truncate font-mono text-xs font-medium text-ink">{file.originalName}</p>
        <div className="flex items-center justify-between text-xs text-muted">
          <span className="font-mono">{formatBytes(file.sizeBytes)}</span>
          {isPublic && <Globe size={13} className="text-warn" />}
        </div>
      </div>

      <div className="absolute right-2 top-2" ref={menuRef}>
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="rounded-md bg-surface p-1.5 text-muted opacity-0 transition-opacity hover:bg-surface2 hover:text-ink group-hover:opacity-100"
        >
          <MoreVertical size={15} />
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
                  setViewingInfo(true);
                  setMenuOpen(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-muted hover:bg-surface hover:text-ink"
              >
                <Info size={14} /> Info
              </button>
              <button
                onClick={handleDownload}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-muted hover:bg-surface hover:text-ink"
              >
                <Download size={14} /> Download
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
