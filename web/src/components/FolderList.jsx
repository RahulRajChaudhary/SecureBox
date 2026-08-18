import { AnimatePresence } from 'framer-motion';
import { useFolders } from '../hooks/useFolders';
import { FolderRow } from './FolderRow';

export function FolderList({ parentId, onOpen }) {
  const { data, isLoading } = useFolders(parentId);
  const folders = data?.data ?? [];

  if (isLoading || folders.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-lg border border-edge bg-surface">
      <AnimatePresence initial={false}>
        {folders.map((folder) => (
          <FolderRow key={folder.id} folder={folder} onOpen={onOpen} />
        ))}
      </AnimatePresence>
    </div>
  );
}
