import { useFolder } from '../hooks/useFolders';
import { formatDate } from '../lib/format';
import { locationLabel } from '../lib/locationLabel';
import { InfoModal } from './InfoModal';

export function FolderInfoModal({ folder, onClose }) {
  const { data } = useFolder(folder.parentId);
  const crumbs = data?.data?.breadcrumb ?? [];

  const rows = [
    ['Type', 'Folder'],
    ['Location', locationLabel(folder.parentId, crumbs)],
    ['Created', formatDate(folder.createdAt)],
    ['Modified', formatDate(folder.updatedAt)],
    ['Visibility', folder.visibility === 'PUBLIC' ? 'Public' : 'Private'],
  ];

  return <InfoModal title={folder.name} rows={rows} onClose={onClose} />;
}
