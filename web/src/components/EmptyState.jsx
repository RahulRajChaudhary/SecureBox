import { motion } from 'framer-motion';
import { FolderOpen } from 'lucide-react';

export function EmptyState({ message = 'No files yet.' }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-edge py-16 text-muted">
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <FolderOpen size={32} />
      </motion.div>
      <p className="text-sm">{message}</p>
    </div>
  );
}
