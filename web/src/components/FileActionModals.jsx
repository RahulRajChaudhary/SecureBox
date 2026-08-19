import { AnimatePresence } from 'framer-motion';
import { RenameModal } from './RenameModal';
import { DeleteConfirm } from './DeleteConfirm';
import { PreviewModal } from './PreviewModal';
import { MoveFileModal } from './MoveFileModal';
import { FileInfoModal } from './FileInfoModal';
import { ShareModal } from './ShareModal';

export function FileActionModals({ file, actions }) {
  const {
    renaming, setRenaming,
    deleting, setDeleting,
    previewing, setPreviewing,
    moving, setMoving,
    viewingInfo, setViewingInfo,
    sharing, setSharing,
    isPublic, toggleVisibility,
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
      {viewingInfo && <FileInfoModal file={file} onClose={() => setViewingInfo(false)} />}
      {sharing && (
        <ShareModal
          file={file}
          isPublic={isPublic}
          isUpdating={isUpdating}
          onToggle={toggleVisibility}
          onClose={() => setSharing(false)}
        />
      )}
    </AnimatePresence>
  );
}
