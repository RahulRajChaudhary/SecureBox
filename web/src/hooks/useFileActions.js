import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { downloadFile } from '../lib/files';
import { getFileIcon } from '../lib/fileIcon';
import { useUpdateFile, useDeleteFile } from './useFiles';

export function useFileActions(file) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [moving, setMoving] = useState(false);
  const [viewingInfo, setViewingInfo] = useState(false);
  const menuRef = useRef(null);
  const updateFile = useUpdateFile();
  const deleteFile = useDeleteFile();

  const isPublic = file.visibility === 'PUBLIC';
  const Icon = getFileIcon(file.mimeType);

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

  async function handleDownload() {
    try {
      await downloadFile(file.id);
    } catch {
      toast.error('Download failed');
    }
  }

  function toggleVisibility() {
    updateFile.mutate(
      { fileId: file.id, patch: { visibility: isPublic ? 'PRIVATE' : 'PUBLIC' } },
      { onError: () => toast.error('Could not change visibility') },
    );
  }

  function handleRename(name) {
    updateFile.mutate(
      { fileId: file.id, patch: { name } },
      {
        onSuccess: () => setRenaming(false),
        onError: () => toast.error('Rename failed'),
      },
    );
  }

  function handleDelete() {
    deleteFile.mutate(file.id, {
      onSuccess: () => toast.success('File deleted'),
      onError: () => toast.error('Delete failed'),
    });
  }

  return {
    menuOpen, setMenuOpen, menuRef,
    renaming, setRenaming,
    deleting, setDeleting,
    previewing, setPreviewing,
    moving, setMoving,
    viewingInfo, setViewingInfo,
    isPublic, Icon,
    isUpdating: updateFile.isPending,
    isDeleting: deleteFile.isPending,
    handleDownload, toggleVisibility, handleRename, handleDelete,
  };
}
