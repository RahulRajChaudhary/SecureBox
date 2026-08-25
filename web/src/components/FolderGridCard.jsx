import { forwardRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckSquare, Folder, FolderInput, Globe, Info, MoreVertical, Pencil, Share2, Star, Trash2 } from 'lucide-react';
import { useFolderActions } from '../hooks/useFolderActions';
import { FolderActionModals } from './FolderActionModals';
import { SelectCheckbox } from './SelectCheckbox';
import { scaleIn, springy, quick } from '../lib/motion';

// forwardRef is required here — AnimatePresence's popLayout mode (used by
// the grid that renders this) attaches a ref to measure exiting items, and
// plain function components can't receive one.
export const FolderGridCard = forwardRef(function FolderGridCard(
  { folder, onOpen, selected = false, selectionActive = false, onToggleSelect },
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
      variants={scaleIn}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={springy}
      className={`group relative flex flex-col rounded-lg border bg-warn/5 transition-all hover:bg-surface2 hover:shadow-lg hover:shadow-black/20 ${
        selected ? 'border-accent' : 'border-edge hover:border-warn/40'
      }`}
    >
      <button
        onClick={() => (selectionActive ? onToggleSelect('folder', folder.id) : onOpen(folder.id))}
        className="flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-t-lg bg-warn/10"
      >
        <Folder size={44} className="text-warn" />
      </button>

      <div className="absolute left-2 top-2 flex items-center gap-1">
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite();
          }}
          title={folder.isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
          className={`rounded-md bg-bg/70 p-1.5 backdrop-blur-sm transition-opacity hover:bg-surface2 ${
            folder.isFavorite ? 'text-warn opacity-100' : 'text-muted opacity-0 group-hover:opacity-100'
          }`}
        >
          <Star size={14} className={folder.isFavorite ? 'fill-warn' : ''} />
        </button>
        {onToggleSelect && (
          <SelectCheckbox
            checked={selected}
            active={selectionActive}
            onToggle={() => onToggleSelect('folder', folder.id)}
          />
        )}
      </div>

      <div
        onClick={() => selectionActive && onToggleSelect('folder', folder.id)}
        className={`flex flex-col gap-1 px-3 py-2 ${selectionActive ? 'cursor-pointer' : ''}`}
      >
        <div className="flex items-center justify-between gap-1">
          <p className="w-full truncate font-mono text-xs font-semibold text-ink">{folder.name}</p>
          {isPublic && <Globe size={13} className="shrink-0 text-warn" />}
        </div>
        {folder.subfolderCount !== undefined && (
          <span className="text-xs text-muted">
            {folder.subfolderCount + folder.fileCount} item{folder.subfolderCount + folder.fileCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      <div className="absolute right-2 top-2" ref={menuRef}>
        <button
          onClick={() => setMenuOpen((v) => !v)}
          title="More options"
          className="rounded-md bg-bg/70 p-1.5 text-muted opacity-0 backdrop-blur-sm transition-opacity hover:bg-surface2 hover:text-ink group-hover:opacity-100"
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
