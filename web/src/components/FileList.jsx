import { AnimatePresence } from 'framer-motion';
import { useFileListing } from '../hooks/useFileListing';
import { FileCard } from './FileCard';
import { EmptyState } from './EmptyState';

function SkeletonRow({ delay }) {
  return (
    <div
      className="flex animate-pulse items-center gap-3 border-b border-edge px-4 py-3 last:border-b-0"
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

export function FileList({ q, sort, folderId, view, emptyMessage }) {
  const { files, isLoading, isError, hasNextPage, isFetchingNextPage, sentinelRef } = useFileListing({
    q, sort, folderId, view,
  });

  if (isLoading)
    return (
      <div className="overflow-hidden rounded-lg border border-edge bg-surface">
        {[0, 1, 2, 3, 4].map((i) => (
          <SkeletonRow key={i} delay={i * 80} />
        ))}
      </div>
    );
  if (isError) return <p className="py-8 text-center text-sm text-red-400">Couldn't load files.</p>;
  if (files.length === 0) return <EmptyState message={emptyMessage} />;

  return (
    <div>
      <p className="mb-2 text-xs text-muted">
        {files.length} file{files.length !== 1 ? 's' : ''} loaded
      </p>
      <div className="overflow-hidden rounded-lg border border-edge bg-surface">
        <AnimatePresence initial={false}>
          {files.map((file, index) => (
            <FileCard key={file.id} file={file} isLast={index === files.length - 1} />
          ))}
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
