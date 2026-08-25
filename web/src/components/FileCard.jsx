import { forwardRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckSquare, Download, Eye, FolderInput, Globe, Info, MoreVertical, Pencil, Share2, Star, Trash2 } from 'lucide-react';
import { formatBytes } from '../lib/format';
import { useFileActions } from '../hooks/useFileActions';
import { FileActionModals } from './FileActionModals';
import { SelectCheckbox } from './SelectCheckbox';
import { row, scaleIn, springy, quick } from '../lib/motion';

// forwardRef is required here — AnimatePresence's popLayout mode (used by
// the list that renders this) attaches a ref to measure exiting items, and
// plain function components can't receive one.
export const FileCard = forwardRef(function FileCard(
  { file, isFirst = false, isLast = false, selected = false, selectionActive = false, onToggleSelect },
  ref,
) {
  const actions = useFileActions(file);
  const {
    menuOpen, setMenuOpen, menuRef,
    isPublic, Icon, iconColor,
    handleDownload, toggleFavorite,
    setRenaming, setDeleting, setPreviewing, setMoving,
    setViewingInfo, setSharing,
  } = actions;

  return (
    <motion.div
      ref={ref}
      layout
      variants={row}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={springy}
      onClick={() => selectionActive && onToggleSelect('file', file.id)}
      className={`group relative flex items-center gap-2 border-b border-edge px-4 py-3 transition-colors last:border-b-0 hover:bg-surface2 sm:gap-3 ${
        selected ? 'bg-accent/5' : ''
      } ${selectionActive ? 'cursor-pointer' : ''} ${isFirst ? 'rounded-t-lg' : ''} ${isLast ? 'z-40 rounded-b-lg' : ''}`}
    >
      <Icon size={18} className={`shrink-0 ${iconColor}`} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-mono text-sm font-medium text-ink">{file.originalName}</p>
        <p className="font-mono text-xs text-muted">{formatBytes(file.sizeBytes)}</p>
      </div>

      {file.isFavorite && <Star size={14} className="shrink-0 fill-warn text-warn" title="Favorite" />}
      {onToggleSelect && (
        <SelectCheckbox checked={selected} active={selectionActive} onToggle={() => onToggleSelect('file', file.id)} />
      )}
      {isPublic && <Globe size={14} className="shrink-0 text-warn" title="Public" />}

      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={(e) => {
          e.stopPropagation();
          if (selectionActive) onToggleSelect('file', file.id);
          else setPreviewing(true);
        }}
        className="rounded-md p-2 text-muted transition-colors hover:bg-surface2 hover:text-ink sm:p-1.5"
        title="Preview"
      >
        <Eye size={16} />
      </motion.button>

      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={(e) => {
          e.stopPropagation();
          handleDownload();
        }}
        className="rounded-md p-2 text-muted transition-colors hover:bg-surface2 hover:text-ink sm:p-1.5"
        title="Download"
      >
        <Download size={16} />
      </motion.button>

      <div className="relative" ref={menuRef}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen((v) => !v);
          }}
          title="More options"
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
              {onToggleSelect && (
                <button
                  onClick={() => {
                    onToggleSelect('file', file.id);
                    setMenuOpen(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-muted hover:bg-surface hover:text-ink"
                >
                  <CheckSquare size={14} /> Select
                </button>
              )}
              <button
                onClick={() => {
                  toggleFavorite();
                  setMenuOpen(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-muted hover:bg-surface hover:text-ink"
              >
                <Star size={14} className={file.isFavorite ? 'fill-warn text-warn' : ''} />
                {file.isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
              </button>
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
});
