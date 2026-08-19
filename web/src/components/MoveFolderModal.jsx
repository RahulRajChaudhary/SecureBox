import { useState } from 'react';
import toast from 'react-hot-toast';
import { useFolders, useUpdateFolder } from '../hooks/useFolders';
import { MoveModal } from './MoveModal';

export function MoveFolderModal({ folder, onClose }) {
  const [targetId, setTargetId] = useState(folder.parentId ?? null);
  const { data, isLoading } = useFolders(targetId);
  // Never offer the folder being moved (or anything reachable only through
  // it) as a destination — filtering it out of every level's listing means
  // its subtree is simply unreachable via this UI.
  const folders = (data?.data ?? []).filter((f) => f.id !== folder.id);
  const updateFolder = useUpdateFolder();

  const atCurrentLocation = targetId === (folder.parentId ?? null);

  function handleMove() {
    updateFolder.mutate(
      { folderId: folder.id, patch: { parentId: targetId } },
      {
        onSuccess: () => {
          toast.success('Folder moved');
          onClose();
        },
        onError: (err) =>
          toast.error(err.status === 409 ? 'Cannot move a folder into itself or its own subfolder' : 'Move failed'),
      },
    );
  }

  return (
    <MoveModal
      title={folder.name}
      targetId={targetId}
      onTargetChange={setTargetId}
      folders={folders}
      isLoading={isLoading}
      atCurrentLocation={atCurrentLocation}
      isMoving={updateFolder.isPending}
      onMove={handleMove}
      onClose={onClose}
    />
  );
}
