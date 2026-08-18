import { RenameModal } from './RenameModal';

export function NewFolderModal({ onSave, onClose, saving }) {
  return (
    <RenameModal
      title="New folder"
      initialName=""
      onSave={onSave}
      onClose={onClose}
      saving={saving}
    />
  );
}
