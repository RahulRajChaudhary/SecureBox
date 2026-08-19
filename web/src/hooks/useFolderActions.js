import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useUpdateFolder, useDeleteFolder } from './useFolders';

export function useFolderActions(folder) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [moving, setMoving] = useState(false);
  const [viewingInfo, setViewingInfo] = useState(false);
  const [sharing, setSharing] = useState(false);
  const menuRef = useRef(null);
  const updateFolder = useUpdateFolder();
  const deleteFolder = useDeleteFolder();

  const isPublic = folder.visibility === 'PUBLIC';

  useEffect(() => {
    if (!menuOpen) return;
    function handlePointer(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    function handleKey(e) {
      if (e.key === 'Escape') setMenuOpen(false);
    }
    document.addEventListener('mousedown', handlePointer);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handlePointer);
      document.removeEventListener('keydown', handleKey);
    };
  }, [menuOpen]);

  function toggleVisibility() {
    updateFolder.mutate(
      { folderId: folder.id, patch: { visibility: isPublic ? 'PRIVATE' : 'PUBLIC' } },
      { onError: () => toast.error('Could not change visibility') },
    );
  }

  function handleRename(name) {
    updateFolder.mutate(
      { folderId: folder.id, patch: { name } },
      {
        onSuccess: () => setRenaming(false),
        onError: () => toast.error('Rename failed'),
      },
    );
  }

  function handleDelete() {
    deleteFolder.mutate(folder.id, {
      onSuccess: () => toast.success('Folder deleted'),
      onError: (err) =>
        toast.error(err.code === 'FOLDER_NOT_EMPTY' ? 'Folder is not empty' : 'Delete failed'),
    });
  }

  return {
    menuOpen, setMenuOpen, menuRef,
    renaming, setRenaming,
    deleting, setDeleting,
    moving, setMoving,
    viewingInfo, setViewingInfo,
    sharing, setSharing,
    isPublic,
    isUpdating: updateFolder.isPending,
    isDeleting: deleteFolder.isPending,
    toggleVisibility, handleRename, handleDelete,
  };
}
