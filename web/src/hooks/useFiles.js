import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { listFiles, updateFile, deleteFile, listTrash, restoreFile } from '../lib/files';

export function useFiles({ q, sort } = {}) {
  return useInfiniteQuery({
    queryKey: ['files', { q, sort }],
    queryFn: ({ pageParam }) => listFiles({ cursor: pageParam, q, sort }),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}

export function useUpdateFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ fileId, patch }) => updateFile(fileId, patch),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['files'] }),
  });
}

export function useDeleteFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (fileId) => deleteFile(fileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
      queryClient.invalidateQueries({ queryKey: ['trash'] });
    },
  });
}

export function useTrash() {
  return useQuery({
    queryKey: ['trash'],
    queryFn: listTrash,
  });
}

export function useRestoreFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (fileId) => restoreFile(fileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
      queryClient.invalidateQueries({ queryKey: ['trash'] });
    },
  });
}
