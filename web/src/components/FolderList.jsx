import { AnimatePresence } from 'framer-motion';
import { useFolders } from '../hooks/useFolders';
import { FolderRow } from './FolderRow';
import { FolderGridCard } from './FolderGridCard';

function sortFolders(folders, sort) {
  const sorted = [...folders];
  switch (sort) {
    case 'name_desc':
      return sorted.sort((a, b) => b.name.localeCompare(a.name));
    case 'createdAt_asc':
      return sorted.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    case 'createdAt_desc':
      return sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    case 'name_asc':
    default:
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
  }
}

export function FolderList({ parentId, onOpen, viewMode = 'list', sort = 'name_asc' }) {
  const { data, isLoading } = useFolders(parentId);
  const folders = sortFolders(data?.data ?? [], sort);

  if (isLoading || folders.length === 0) return null;

  if (viewMode === 'grid') {
    return (
      <div>
        <p className="mb-2 text-xs text-muted">
          {folders.length} folder{folders.length !== 1 ? 's' : ''}
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          <AnimatePresence initial={false}>
            {folders.map((folder) => (
              <FolderGridCard key={folder.id} folder={folder} onOpen={onOpen} />
            ))}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-2 text-xs text-muted">
        {folders.length} folder{folders.length !== 1 ? 's' : ''}
      </p>
      <div className="rounded-lg border border-edge bg-surface">
        <AnimatePresence initial={false}>
          {folders.map((folder, index) => (
            <FolderRow
              key={folder.id}
              folder={folder}
              onOpen={onOpen}
              isFirst={index === 0}
              isLast={index === folders.length - 1}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
