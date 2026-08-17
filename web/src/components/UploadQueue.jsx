import { AnimatePresence, motion } from 'framer-motion';
import { Pause, Play, X } from 'lucide-react';
import { useUploadStore, managers } from '../lib/uploadStore';
import { formatBytes } from '../lib/format';
import { row, springy } from '../lib/motion';

const STATUS_LABEL = {
  'creating-intent': 'Starting…',
  uploading: 'Uploading…',
  paused: 'Paused',
  completing: 'Verifying…',
  done: 'Done',
  error: 'Failed',
  aborted: 'Cancelled',
};

export function UploadQueue() {
  const uploads = useUploadStore((s) => s.uploads);
  const removeUpload = useUploadStore((s) => s.removeUpload);

  const active = uploads.filter((u) => u.status !== 'aborted');
  if (active.length === 0) return null;

  return (
    <div className="divide-y divide-edge overflow-hidden rounded-lg border border-edge bg-surface">
      <AnimatePresence initial={false}>
        {active.map((u) => {
          const manager = managers.get(u.id);
          const pct = u.totalBytes ? Math.round((u.uploadedBytes / u.totalBytes) * 100) : 0;
          const settled = u.status === 'done' || u.status === 'error';
          const isUploading = u.status === 'uploading';

          return (
            <motion.div
              key={u.id}
              layout
              variants={row}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={springy}
              className="flex items-center gap-3 px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate font-mono text-sm font-medium text-ink">{u.name}</p>
                  <span className="shrink-0 text-xs text-muted">
                    {u.status === 'error' ? u.error : STATUS_LABEL[u.status] ?? u.status}
                  </span>
                </div>
                <div className="relative mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-surface2">
                  <motion.div
                    animate={{ width: `${u.status === 'done' ? 100 : pct}%` }}
                    transition={springy}
                    className={`h-full rounded-full ${u.status === 'error' ? 'bg-red-400' : 'bg-accent'}`}
                  />
                  {isUploading && (
                    <div
                      className="absolute inset-0 animate-shimmer bg-[length:200%_100%] bg-[linear-gradient(110deg,transparent,rgba(255,255,255,0.25),transparent)]"
                      style={{ width: `${pct}%` }}
                    />
                  )}
                </div>
                <p className="mt-1 font-mono text-xs text-muted">
                  {u.status === 'done'
                    ? formatBytes(u.size)
                    : `${formatBytes(u.uploadedBytes)} / ${formatBytes(u.size)}`}
                </p>
              </div>

              {isUploading && (
                <button
                  onClick={() => manager?.pause()}
                  className="rounded-md p-1.5 text-muted transition-colors hover:bg-surface2 hover:text-ink"
                  title="Pause"
                >
                  <Pause size={15} />
                </button>
              )}
              {u.status === 'paused' && (
                <button
                  onClick={() => manager?.resume()}
                  className="rounded-md p-1.5 text-muted transition-colors hover:bg-surface2 hover:text-ink"
                  title="Resume"
                >
                  <Play size={15} />
                </button>
              )}
              {settled ? (
                <button
                  onClick={() => removeUpload(u.id)}
                  className="rounded-md p-1.5 text-muted transition-colors hover:bg-surface2 hover:text-ink"
                  title="Dismiss"
                >
                  <X size={15} />
                </button>
              ) : (
                <button
                  onClick={() => manager?.abort()}
                  className="rounded-md p-1.5 text-muted transition-colors hover:bg-surface2 hover:text-ink"
                  title="Cancel"
                >
                  <X size={15} />
                </button>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
