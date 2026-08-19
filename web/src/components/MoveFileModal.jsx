import { useState } from 'react';
import toast from 'react-hot-toast';
import { useFolders } from '../hooks/useFolders';
import { useUpdateFile } from '../hooks/useFiles';
import { MoveModal } from './MoveModal';

export function MoveFileModal({ file, onClose }) {
  const [targetId, setTargetId] = useState(file.folderId ?? null);
  const { data, isLoading } = useFolders(targetId);
  const folders = data?.data ?? [];
  const updateFile = useUpdateFile();

  const atCurrentLocation = targetId === (file.folderId ?? null);

  function handleMove() {
    updateFile.mutate(
      { fileId: file.id, patch: { folderId: targetId } },
      {
        onSuccess: () => {
          toast.success('File moved');
          onClose();
        },
        onError: () => toast.error('Move failed'),
      },
    );
  }

  return (
    <MoveModal
      title={file.originalName}
      targetId={targetId}
      onTargetChange={setTargetId}
      folders={folders}
      isLoading={isLoading}
      atCurrentLocation={atCurrentLocation}
      isMoving={updateFile.isPending}
      onMove={handleMove}
      onClose={onClose}
    />
  );
}
