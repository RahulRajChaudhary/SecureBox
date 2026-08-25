import { useEffect, useRef } from 'react';
import { useFiles } from './useFiles';

export function useFileListing({ q, sort, folderId, view, enabled = true }) {
  const { data, isLoading, isError, hasNextPage, fetchNextPage, isFetchingNextPage } = useFiles({
    q, sort, folderId, view, enabled,
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

  // React Query's `enabled: false` only stops refetching — it doesn't clear
  // previously-fetched `data`, so a disabled query still returns whatever
  // was cached from before it was disabled. Force an empty result here so
  // "Folders only" (filesEnabled: false) actually hides files instead of
  // showing whatever page happened to be cached already.
  const files = enabled ? (data?.pages.flatMap((page) => page.data) ?? []) : [];

  return { files, isLoading: enabled && isLoading, isError, hasNextPage: enabled && hasNextPage, isFetchingNextPage, sentinelRef };
}
