import { forwardRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckSquare, Folder, FolderInput, Globe, Info, MoreVertical, Pencil, Share2, Star, Trash2 } from 'lucide-react';
import { useFolderActions } from '../hooks/useFolderActions';
import { FolderActionModals } from './FolderActionModals';
import { SelectCheckbox } from './SelectCheckbox';
import { row, scaleIn, springy, quick } from '../lib/motion';

// forwardRef is required here — AnimatePresence's popLayout mode (used by
// the list that renders this) attaches a ref to measure exiting items, and
// plain function components can't receive one.
export const FolderRow = forwardRef(function FolderRow(
  { folder, onOpen, isFirst = false, isLast = false, selected = false, selectionActive = false, onToggleSelect },
  ref,
) {
  const actions = useFolderActions(folder);
  const {
    menuOpen, setMenuOpen, menuRef,
    isPublic, toggleFavorite,
    setRenaming, setDeleting, setMoving, setViewingInfo, setSharing,
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
      onClick={() => selectionActive && onToggleSelect('folder', folder.id)}
      className={`group relative flex items-center gap-2 border-b border-edge bg-warn/5 px-4 py-3 transition-colors last:border-b-0 hover:bg-surface2 sm:gap-3 ${
        selected ? 'bg-accent/10' : ''
      } ${selectionActive ? 'cursor-pointer' : ''} ${isFirst ? 'rounded-t-lg' : ''} ${isLast ? 'z-40 rounded-b-lg' : ''}`}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (selectionActive) onToggleSelect('folder', folder.id);
          else onOpen(folder.id);
        }}
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
      >
        <Folder size={18} className="shrink-0 text-warn" />
        <p className="truncate font-mono text-sm font-semibold text-ink">{folder.name}</p>
        {folder.subfolderCount !== undefined && (
          <span className="shrink-0 font-mono text-xs text-muted">
            {folder.subfolderCount + folder.fileCount} item{folder.subfolderCount + folder.fileCount !== 1 ? 's' : ''}
          </span>
        )}
      </button>

      {folder.isFavorite && <Star size={14} className="shrink-0 fill-warn text-warn" title="Favorite" />}
      {onToggleSelect && (
        <SelectCheckbox checked={selected} active={selectionActive} onToggle={() => onToggleSelect('folder', folder.id)} />
      )}
      {isPublic && <Globe size={14} className="shrink-0 text-warn" title="Public" />}

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
                    onToggleSelect('folder', folder.id);
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
                <Star size={14} className={folder.isFavorite ? 'fill-warn text-warn' : ''} />
                {folder.isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
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

      <FolderActionModals folder={folder} actions={actions} />
    </motion.div>
  );
});
