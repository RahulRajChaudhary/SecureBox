import { AnimatePresence } from 'framer-motion';
import { useTrash } from '../hooks/useFiles';
import { TrashCard } from './TrashCard';
import { EmptyState } from './EmptyState';

export function TrashList() {
  const { data, isLoading, isError } = useTrash();

  if (isLoading)
    return <p className="py-8 text-center text-sm text-muted">Loading…</p>;
  if (isError) return <p className="py-8 text-center text-sm text-red-400">Couldn't load trash.</p>;

  const files = data.data;
  if (files.length === 0) return <EmptyState message="Trash is empty." />;

  return (
    <div>
      <p className="mb-2 text-xs text-muted">
        {files.length} file{files.length !== 1 ? 's' : ''} in trash — restorable until permanently
        deleted
      </p>
      <div className="overflow-hidden rounded-lg border border-edge bg-surface">
        <AnimatePresence initial={false}>
          {files.map((file) => (
            <TrashCard key={file.id} file={file} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
