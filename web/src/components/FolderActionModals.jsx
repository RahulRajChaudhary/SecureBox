import { AnimatePresence } from 'framer-motion';
import { RenameModal } from './RenameModal';
import { DeleteConfirm } from './DeleteConfirm';
import { MoveFolderModal } from './MoveFolderModal';
import { FolderInfoModal } from './FolderInfoModal';
import { ShareModal } from './ShareModal';

export function FolderActionModals({ folder, actions }) {
  const {
    renaming, setRenaming,
    deleting, setDeleting,
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
          title="Rename folder"
          initialName={folder.name}
          onSave={handleRename}
          onClose={() => setRenaming(false)}
          saving={isUpdating}
        />
      )}
      {deleting && (
        <DeleteConfirm
          title="Delete folder"
          name={folder.name}
          message={
            <>
              Delete <span className="font-mono font-medium text-ink">{folder.name}</span>? The
              folder must be empty.
            </>
          }
          onConfirm={handleDelete}
          onClose={() => setDeleting(false)}
          deleting={isDeleting}
        />
      )}
      {moving && <MoveFolderModal folder={folder} onClose={() => setMoving(false)} />}
      {viewingInfo && <FolderInfoModal folder={folder} onClose={() => setViewingInfo(false)} />}
      {sharing && (
        <ShareModal
          name={folder.name}
          shareSlug={folder.shareSlug}
          isPublic={isPublic}
          isUpdating={isUpdating}
          onToggle={toggleVisibility}
          onClose={() => setSharing(false)}
          kind="folder"
        />
      )}
    </AnimatePresence>
  );
}
