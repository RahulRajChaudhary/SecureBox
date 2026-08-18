import { motion } from 'framer-motion';
import { useFolder } from '../hooks/useFolders';
import { formatBytes, formatDate } from '../lib/format';
import { backdropFade, scaleIn, quick } from '../lib/motion';

function locationLabel(file, crumbs) {
  if (!file.folderId || crumbs.length === 0) return 'My Drive';
  return crumbs.map((crumb) => crumb.name).join(' / ');
}

export function InfoModal({ file, onClose }) {
  const { data } = useFolder(file.folderId);
  const crumbs = data?.data?.breadcrumb ?? [];

  const rows = [
    ['Type', file.mimeType || 'Unknown'],
    ['Size', formatBytes(file.sizeBytes)],
    ['Location', locationLabel(file, crumbs)],
    ['Created', formatDate(file.createdAt)],
    ['Modified', formatDate(file.updatedAt)],
    ['Visibility', file.visibility === 'PUBLIC' ? 'Public' : 'Private'],
  ];

  return (
    <motion.div
      variants={backdropFade}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={quick}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    >
      <motion.div
        variants={scaleIn}
        transition={quick}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-lg border border-edge bg-surface p-5 shadow-2xl"
      >
        <h2 className="mb-3 truncate text-sm font-semibold text-ink">{file.originalName}</h2>
        <dl className="flex flex-col gap-2">
          {rows.map(([label, value]) => (
            <div key={label} className="flex items-center justify-between gap-3 text-sm">
              <dt className="text-muted">{label}</dt>
              <dd className="truncate font-mono text-ink">{value}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-md px-3 py-1.5 text-sm text-muted transition-colors hover:bg-surface2 hover:text-ink"
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
