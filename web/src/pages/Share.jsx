import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Download, File, ShieldCheck } from 'lucide-react';
import { getShareMeta } from '../lib/files';
import { formatBytes } from '../lib/format';
import { fadeUp, quick } from '../lib/motion';

export function Share() {
  const { slug } = useParams();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['share', slug],
    queryFn: () => getShareMeta(slug),
    retry: false,
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4 py-16">
      <motion.div
        initial={fadeUp.initial}
        animate={fadeUp.animate}
        transition={quick}
        className="w-full max-w-sm rounded-lg border border-edge bg-surface p-6 text-center"
      >
        <div className="mb-4 flex items-center justify-center gap-2 font-mono text-sm font-semibold text-ink">
          <ShieldCheck size={18} className="text-accent" />
          SecureBox
        </div>

        {isLoading && <p className="text-sm text-muted">Loading…</p>}
        {isError && (
          <p className="text-sm text-red-400">This link is invalid or has expired.</p>
        )}

        {data && (
          <>
            <File size={28} className="mx-auto mb-2 text-muted" />
            <p className="break-all font-mono text-sm font-medium text-ink">
              {data.data.originalName}
            </p>
            <p className="mb-4 text-xs text-muted">{formatBytes(data.data.sizeBytes)}</p>
            <motion.a
              whileTap={{ scale: 0.97 }}
              href={`/api/share/${slug}/download`}
              className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-bg transition-colors hover:bg-accent-dim"
            >
              <Download size={15} />
              Download
            </motion.a>
          </>
        )}
      </motion.div>
    </div>
  );
}
