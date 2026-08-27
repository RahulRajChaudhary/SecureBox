import { AnimatePresence, motion } from 'framer-motion';
import { useTrash } from '../hooks/useFiles';
import { TrashCard } from './TrashCard';
import { EmptyState } from './EmptyState';
import { backdropFade, quick } from '../lib/motion';

function SkeletonRow({ delay }) {
  return (
    <div
      className="flex animate-pulse items-center gap-2 border-b border-edge px-4 py-3 last:border-b-0 sm:gap-3"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="h-[18px] w-[18px] shrink-0 rounded bg-surface2" />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="h-3.5 w-1/3 rounded bg-surface2" />
        <div className="h-2.5 w-40 rounded bg-surface2" />
      </div>
      <div className="h-6 w-16 shrink-0 rounded bg-surface2" />
    </div>
  );
}

export function TrashList() {
  const { data, isLoading, isError } = useTrash();
  const files = data?.data ?? [];

  return (
    <AnimatePresence mode="wait" initial={false}>
      {isLoading ? (
        <motion.div key="loading" variants={backdropFade} initial="initial" animate="animate" exit="exit" transition={quick}>
          <div className="overflow-hidden rounded-lg border border-edge bg-surface">
            {[0, 1, 2, 3, 4].map((i) => (
              <SkeletonRow key={i} delay={i * 80} />
            ))}
          </div>
        </motion.div>
      ) : isError ? (
        <motion.p
          key="error"
          variants={backdropFade}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={quick}
          className="py-8 text-center text-sm text-red-400"
        >
          Couldn't load trash.
        </motion.p>
      ) : files.length === 0 ? (
        <motion.div key="empty" variants={backdropFade} initial="initial" animate="animate" exit="exit" transition={quick}>
          <EmptyState message="Trash is empty." />
        </motion.div>
      ) : (
        <motion.div key="content" variants={backdropFade} initial="initial" animate="animate" exit="exit" transition={quick}>
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
        </motion.div>
      )}
    </AnimatePresence>
  );
}
