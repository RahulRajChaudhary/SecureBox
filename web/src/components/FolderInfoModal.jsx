import { Folder } from 'lucide-react';
import { useFolder } from '../hooks/useFolders';
import { formatDate } from '../lib/format';
import { locationLabel } from '../lib/locationLabel';
import { InfoModal } from './InfoModal';

export function FolderInfoModal({ folder, onClose }) {
  const { data } = useFolder(folder.parentId);
  const crumbs = data?.data?.breadcrumb ?? [];

  const rows = [
    ['Type', 'Folder'],
    ['Items', folder.subfolderCount !== undefined ? `${folder.subfolderCount + folder.fileCount}` : 'Unknown'],
    ['Location', locationLabel(folder.parentId, crumbs)],
    ['Created', formatDate(folder.createdAt)],
    ['Modified', formatDate(folder.updatedAt)],
    ['Visibility', folder.visibility === 'PUBLIC' ? 'Public' : 'Private'],
    ['Favorite', folder.isFavorite ? 'Yes' : 'No'],
  ];

  return (
    <InfoModal
      title={folder.name}
      icon={<Folder size={40} className="text-warn" />}
      rows={rows}
      onClose={onClose}
    />
  );
}
