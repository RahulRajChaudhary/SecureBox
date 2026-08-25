import { AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';
import { useFileListing } from '../hooks/useFileListing';
import { FileCard } from './FileCard';
import { FolderRow } from './FolderRow';
import { EmptyState } from './EmptyState';
import { sortEntries } from '../lib/sortEntries';

function SkeletonRow({ delay }) {
  return (
    <div
      className="flex animate-pulse items-center gap-3 border-b border-edge px-4 py-3 last:border-b-0 first:rounded-t-lg last:rounded-b-lg"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="h-[18px] w-[18px] shrink-0 rounded bg-surface2" />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="h-3.5 w-1/3 rounded bg-surface2" />
        <div className="h-2.5 w-16 rounded bg-surface2" />
      </div>
      <div className="h-5 w-16 rounded bg-surface2" />
      <div className="h-6 w-6 rounded bg-surface2" />
    </div>
  );
}

// Folders and files render as one continuous list, sorted together — a
// folder isn't pinned first just for being a folder — inside a single
// bordered container, instead of two separate blocks with their own
// headers/gaps.
export function FileList({
  folders = [], onOpenFolder, q, sort, folderId, view, emptyMessage, filesEnabled = true,
  selected, onToggleSelect, onSelectAll,
}) {
  const { files, isLoading, isError, hasNextPage, isFetchingNextPage, sentinelRef } = useFileListing({
    q, sort, folderId, view, enabled: filesEnabled,
  });

  if (isLoading)
    return (
      <div className="rounded-lg border border-edge bg-surface">
        {[0, 1, 2, 3, 4].map((i) => (
          <SkeletonRow key={i} delay={i * 80} />
        ))}
      </div>
    );
  if (isError) return <p className="py-8 text-center text-sm text-red-400">Couldn't load files.</p>;

  const total = folders.length + files.length;
  if (total === 0) return <EmptyState message={emptyMessage} />;

  const selectionActive = Boolean(selected?.size);
  const allSelected = selectionActive && folders.every((f) => selected.has(`folder:${f.id}`)) && files.every((f) => selected.has(`file:${f.id}`));

  return (
    <div>
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
      <div className="rounded-lg border border-edge bg-surface">
        <AnimatePresence initial={false} mode="popLayout">
          {sortEntries(folders, files, sort).map((entry, index, all) =>
            entry.type === 'folder' ? (
              <FolderRow
                key={`folder-${entry.folder.id}`}
                folder={entry.folder}
                onOpen={onOpenFolder}
                isFirst={index === 0}
                isLast={index === all.length - 1}
                selected={selected?.has(`folder:${entry.folder.id}`)}
                selectionActive={selectionActive}
                onToggleSelect={onToggleSelect}
              />
            ) : (
              <FileCard
                key={entry.file.id}
                file={entry.file}
                isFirst={index === 0}
                isLast={index === all.length - 1}
                selected={selected?.has(`file:${entry.file.id}`)}
                selectionActive={selectionActive}
                onToggleSelect={onToggleSelect}
              />
            ),
          )}
        </AnimatePresence>
        {hasNextPage && (
          <div ref={sentinelRef} className="p-3 text-center text-xs text-muted">
            {isFetchingNextPage ? 'Loading more…' : ''}
          </div>
        )}
      </div>
    </div>
  );
}
