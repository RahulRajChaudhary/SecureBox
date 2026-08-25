import { useState } from 'react';
import toast from 'react-hot-toast';
import { useFolders, useUpdateFolder } from '../hooks/useFolders';
import { useUpdateFile } from '../hooks/useFiles';
import { MoveModal } from './MoveModal';

// `entries` is an array of { type: 'file' | 'folder', id }. Unlike the
// single-item move modals, there's no one "current location" to disable
// against — items can come from different folders (e.g. a search or the
// Favorites view) — so the destination picker is always enabled and any
// per-item failures (moving a folder into its own descendant, etc.) are
// reported in the summary toast instead of pre-validated.
export function BulkMoveModal({ entries, onClose }) {
  const [targetId, setTargetId] = useState(null);
  const { data, isLoading } = useFolders(targetId);
  const folders = data?.data ?? [];
  const updateFile = useUpdateFile();
  const updateFolder = useUpdateFolder();
  const [isMoving, setIsMoving] = useState(false);

  async function handleMove() {
    setIsMoving(true);
    const results = await Promise.allSettled(
      entries.map((entry) =>
        entry.type === 'file'
          ? updateFile.mutateAsync({ fileId: entry.id, patch: { folderId: targetId } })
          : updateFolder.mutateAsync({ folderId: entry.id, patch: { parentId: targetId } }),
      ),
    );
    const failed = results.filter((r) => r.status === 'rejected').length;
    const succeeded = results.length - failed;
    if (succeeded) toast.success(`Moved ${succeeded} item${succeeded !== 1 ? 's' : ''}`);
    if (failed) toast.error(`${failed} item${failed !== 1 ? 's' : ''} could not be moved`);
    setIsMoving(false);
    onClose();
  }

  return (
    <MoveModal
      title={`${entries.length} item${entries.length !== 1 ? 's' : ''}`}
      targetId={targetId}
      onTargetChange={setTargetId}
      folders={folders}
      isLoading={isLoading}
      atCurrentLocation={false}
      isMoving={isMoving}
      onMove={handleMove}
      onClose={onClose}
    />
  );
}
