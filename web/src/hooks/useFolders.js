import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { listFolders, getFolder, createFolder, updateFolder, deleteFolder } from '../lib/folders';

export function useFolders(parentId, { enabled = true } = {}) {
  return useQuery({
    queryKey: ['folders', parentId ?? 'root'],
    queryFn: () => listFolders(parentId),
    enabled,
  });
}

export function useFolder(folderId) {
  return useQuery({
    queryKey: ['folder', folderId],
    queryFn: () => getFolder(folderId),
    enabled: Boolean(folderId),
  });
}

export function useCreateFolder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ name, parentId }) => createFolder({ name, parentId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['folders'] }),
  });
}

export function useUpdateFolder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ folderId, patch }) => updateFolder(folderId, patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      queryClient.invalidateQueries({ queryKey: ['folder'] });
    },
  });
}

export function useDeleteFolder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (folderId) => deleteFolder(folderId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['folders'] }),
  });
}
