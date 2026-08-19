import { useFolder } from '../hooks/useFolders';
import { formatBytes, formatDate } from '../lib/format';
import { locationLabel } from '../lib/locationLabel';
import { InfoModal } from './InfoModal';

export function FileInfoModal({ file, onClose }) {
  const { data } = useFolder(file.folderId);
  const crumbs = data?.data?.breadcrumb ?? [];

  const rows = [
    ['Type', file.mimeType || 'Unknown'],
    ['Size', formatBytes(file.sizeBytes)],
    ['Location', locationLabel(file.folderId, crumbs)],
    ['Created', formatDate(file.createdAt)],
    ['Modified', formatDate(file.updatedAt)],
    ['Visibility', file.visibility === 'PUBLIC' ? 'Public' : 'Private'],
  ];

  return <InfoModal title={file.originalName} rows={rows} onClose={onClose} />;
}
