import { useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useFiles } from '../hooks/useFiles';
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

export function FileList({ q, sort }) {
  const { data, isLoading, isError, hasNextPage, fetchNextPage, isFetchingNextPage } = useFiles({
    q,
    sort,
  });

  const sentinelRef = useRef(null);

  useEffect(() => {
    if (!hasNextPage) return;
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetchingNextPage) fetchNextPage();
      },
      { rootMargin: '200px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading)
    return (
      <div className="overflow-hidden rounded-lg border border-edge bg-surface">
        {[0, 1, 2, 3, 4].map((i) => (
          <SkeletonRow key={i} delay={i * 80} />
        ))}
      </div>
    );
  if (isError) return <p className="py-8 text-center text-sm text-red-400">Couldn't load files.</p>;

  const files = data.pages.flatMap((page) => page.data);
  if (files.length === 0) return <EmptyState message={q ? 'No files match your search.' : undefined} />;

  return (
    <div>
      <p className="mb-2 text-xs text-muted">
        {files.length} file{files.length !== 1 ? 's' : ''} loaded
      </p>
      <div className="overflow-hidden rounded-lg border border-edge bg-surface">
        <AnimatePresence initial={false}>
          {files.map((file) => (
            <FileCard key={file.id} file={file} />
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
