import { AnimatePresence } from 'framer-motion';
import { RenameModal } from './RenameModal';
import { DeleteConfirm } from './DeleteConfirm';
import { PreviewModal } from './PreviewModal';
import { MoveFileModal } from './MoveFileModal';

export function FileActionModals({ file, actions }) {
  const {
    renaming, setRenaming,
    deleting, setDeleting,
    previewing, setPreviewing,
    moving, setMoving,
    isUpdating, isDeleting,
    handleRename, handleDelete,
  } = actions;

  return (
    <AnimatePresence>
      {renaming && (
        <RenameModal
          initialName={file.originalName}
          onSave={handleRename}
          onClose={() => setRenaming(false)}
          saving={isUpdating}
        />
      )}
      {deleting && (
        <DeleteConfirm
          name={file.originalName}
          onConfirm={handleDelete}
          onClose={() => setDeleting(false)}
          deleting={isDeleting}
        />
      )}
      {previewing && <PreviewModal file={file} onClose={() => setPreviewing(false)} />}
      {moving && <MoveFileModal file={file} onClose={() => setMoving(false)} />}
    </AnimatePresence>
  );
}
