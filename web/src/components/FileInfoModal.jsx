import { useFolder } from '../hooks/useFolders';
import { formatBytes, formatDate } from '../lib/format';
import { locationLabel } from '../lib/locationLabel';
import { getFileTypeStyle } from '../lib/fileTypeStyle';
import { InfoModal } from './InfoModal';

export function FileInfoModal({ file, onClose }) {
  const { data } = useFolder(file.folderId);
  const crumbs = data?.data?.breadcrumb ?? [];
  const { Icon, color } = getFileTypeStyle(file.mimeType);

  const rows = [
    ['Type', file.mimeType || 'Unknown'],
    ['Size', formatBytes(file.sizeBytes)],
    ['Location', locationLabel(file.folderId, crumbs)],
    ['Created', formatDate(file.createdAt)],
    ['Modified', formatDate(file.updatedAt)],
    ['Visibility', file.visibility === 'PUBLIC' ? 'Public' : 'Private'],
    ['Favorite', file.isFavorite ? 'Yes' : 'No'],
  ];

  return (
    <InfoModal
      title={file.originalName}
      icon={<Icon size={40} className={color} />}
      rows={rows}
      onClose={onClose}
    />
  );
}
