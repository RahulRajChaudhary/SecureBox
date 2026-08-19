import { useQuery } from '@tanstack/react-query';
import { getPreviewUrl } from '../lib/files';

export function useResolvedUrl(fileId, enabled) {
  return useQuery({
    queryKey: ['preview-url', fileId],
    queryFn: () => getPreviewUrl(fileId),
    enabled,
    staleTime: 30_000,
  });
}
