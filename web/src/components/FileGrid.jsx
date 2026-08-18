import { AnimatePresence } from 'framer-motion';
import { useFileListing } from '../hooks/useFileListing';
import { FileGridCard } from './FileGridCard';
import { EmptyState } from './EmptyState';

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

export function FileGrid({ q, sort, folderId, view, emptyMessage }) {
  const { files, isLoading, isError, hasNextPage, isFetchingNextPage, sentinelRef } = useFileListing({
    q, sort, folderId, view,
  });

  if (isLoading)
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {[0, 1, 2, 3, 4].map((i) => (
          <SkeletonCard key={i} delay={i * 80} />
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
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        <AnimatePresence initial={false}>
          {files.map((file) => (
            <FileGridCard key={file.id} file={file} />
          ))}
        </AnimatePresence>
      </div>
      {hasNextPage && (
        <div ref={sentinelRef} className="p-3 text-center text-xs text-muted">
          {isFetchingNextPage ? 'Loading more…' : ''}
        </div>
      )}
    </div>
  );
}
