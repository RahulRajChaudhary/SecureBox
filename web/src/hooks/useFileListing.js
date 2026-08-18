import { useEffect, useRef } from 'react';
import { useFiles } from './useFiles';

export function useFileListing({ q, sort, folderId, view }) {
  const { data, isLoading, isError, hasNextPage, fetchNextPage, isFetchingNextPage } = useFiles({
    q, sort, folderId, view,
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

  const files = data?.pages.flatMap((page) => page.data) ?? [];

  return { files, isLoading, isError, hasNextPage, isFetchingNextPage, sentinelRef };
}
