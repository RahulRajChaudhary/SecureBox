import { AnimatePresence, motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { useFileListing } from '../hooks/useFileListing';
import { FileGridCard } from './FileGridCard';
import { FolderGridCard } from './FolderGridCard';
import { EmptyState } from './EmptyState';
import { sortEntries } from '../lib/sortEntries';
import { backdropFade, quick } from '../lib/motion';

function SkeletonCard({ delay }) {
  return (
    <div
      className="flex animate-pulse flex-col gap-3 rounded-lg border border-edge bg-surface p-3"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="mx-auto h-8 w-8 rounded bg-surface2" />
      <div className="mx-auto h-3 w-2/3 rounded bg-surface2" />
    </div>
  );
}

// Folders and files render in one shared grid, sorted together — a folder
// isn't pinned first just for being a folder — instead of two separate
// grids stacked with their own headers.
export function FileGrid({
  folders = [], onOpenFolder, q, sort, folderId, view, emptyMessage, filesEnabled = true,
  selected, onToggleSelect, onSelectAll,
}) {
  const { files, isLoading, isError, hasNextPage, isFetchingNextPage, sentinelRef } = useFileListing({
    q, sort, folderId, view, enabled: filesEnabled,
  });

  const total = folders.length + files.length;
  const selectionActive = Boolean(selected?.size);
  const allSelected = selectionActive && folders.every((f) => selected.has(`folder:${f.id}`)) && files.every((f) => selected.has(`file:${f.id}`));

  return (
    <AnimatePresence mode="wait" initial={false}>
      {isLoading ? (
        <motion.div
          key="loading"
          variants={backdropFade}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={quick}
          className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
        >
          {[0, 1, 2, 3, 4].map((i) => (
            <SkeletonCard key={i} delay={i * 80} />
          ))}
        </motion.div>
      ) : isError ? (
        <motion.p
          key="error"
          variants={backdropFade}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={quick}
          className="py-8 text-center text-sm text-red-400"
        >
          Couldn't load files.
        </motion.p>
      ) : total === 0 ? (
        <motion.div key="empty" variants={backdropFade} initial="initial" animate="animate" exit="exit" transition={quick}>
          <EmptyState message={emptyMessage} />
        </motion.div>
      ) : (
        <motion.div key="content" variants={backdropFade} initial="initial" animate="animate" exit="exit" transition={quick}>
          <div className="mb-2 flex items-center gap-2">
            {onSelectAll && selectionActive && (
              <button
                onClick={() => onSelectAll(folders, files)}
                title={allSelected ? 'Deselect all' : 'Select all'}
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                  allSelected ? 'border-accent bg-accent text-bg' : 'border-edge text-transparent hover:border-accent/60'
                }`}
              >
                <Check size={11} strokeWidth={3} />
              </button>
            )}
            <p className="text-xs text-muted">
              {selectionActive ? `${selected.size} selected` : `${total} item${total !== 1 ? 's' : ''}`}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            <AnimatePresence initial={false} mode="popLayout">
              {sortEntries(folders, files, sort).map((entry) =>
                entry.type === 'folder' ? (
                  <FolderGridCard
                    key={`folder-${entry.folder.id}`}
                    folder={entry.folder}
                    onOpen={onOpenFolder}
                    selected={selected?.has(`folder:${entry.folder.id}`)}
                    selectionActive={selectionActive}
                    onToggleSelect={onToggleSelect}
                  />
                ) : (
                  <FileGridCard
                    key={entry.file.id}
                    file={entry.file}
                    selected={selected?.has(`file:${entry.file.id}`)}
                    selectionActive={selectionActive}
                    onToggleSelect={onToggleSelect}
                  />
                ),
              )}
            </AnimatePresence>
          </div>
          {hasNextPage && (
            <div ref={sentinelRef} className="p-3 text-center text-xs text-muted">
              {isFetchingNextPage ? 'Loading more…' : ''}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
