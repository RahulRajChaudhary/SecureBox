import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, Download, File, Folder, ShieldCheck } from 'lucide-react';
import { getFolderShareMeta, getFolderShareBrowse } from '../lib/folderShare';
import { formatBytes } from '../lib/format';
import { fadeUp, quick } from '../lib/motion';

export function ShareFolder() {
  const { slug, folderId } = useParams();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['share-folder', slug, folderId ?? 'root'],
    queryFn: () => (folderId ? getFolderShareBrowse(slug, folderId) : getFolderShareMeta(slug)),
    retry: false,
  });

  const folder = data?.data;

  return (
    <div className="flex min-h-screen items-start justify-center bg-bg px-4 py-16">
      <motion.div
        initial={fadeUp.initial}
        animate={fadeUp.animate}
        transition={quick}
        className="w-full max-w-lg rounded-lg border border-edge bg-surface p-6"
      >
        <div className="mb-4 flex items-center justify-center gap-2 font-mono text-sm font-semibold text-ink">
          <ShieldCheck size={18} className="text-accent" />
          SecureBox
        </div>

        {isLoading && <p className="text-center text-sm text-muted">Loading…</p>}
        {isError && <p className="text-center text-sm text-red-400">This link is invalid or has expired.</p>}

        {folder && (
          <>
            <div className="mb-4 flex flex-wrap items-center gap-1 text-sm">
              {folder.breadcrumb.map((crumb, i) => (
                <span key={crumb.id} className="flex items-center gap-1">
                  {i > 0 && <ChevronRight size={14} className="text-muted" />}
                  <Link
                    to={i === 0 ? `/share/folder/${slug}` : `/share/folder/${slug}/${crumb.id}`}
                    className={`rounded-md px-2 py-1 font-mono transition-colors hover:bg-surface2 ${
                      i === folder.breadcrumb.length - 1 ? 'font-medium text-ink' : 'text-muted hover:text-ink'
                    }`}
                  >
                    {crumb.name}
                  </Link>
                </span>
              ))}
            </div>

            {folder.subfolders.length === 0 && folder.files.length === 0 && (
              <p className="py-8 text-center text-sm text-muted">This folder is empty.</p>
            )}

            <div className="flex flex-col gap-1">
              {folder.subfolders.map((sub) => (
                <Link
                  key={sub.id}
                  to={`/share/folder/${slug}/${sub.id}`}
                  className="flex items-center gap-2 rounded-md px-2 py-2 text-sm text-ink hover:bg-surface2"
                >
                  <Folder size={16} className="shrink-0 text-accent" />
                  <span className="truncate font-mono">{sub.name}</span>
                </Link>
              ))}
              {folder.files.map((file) => (
                <a
                  key={file.id}
                  href={`/api/share/folder/${slug}/files/${file.id}/download`}
                  className="flex items-center gap-2 rounded-md px-2 py-2 text-sm text-ink hover:bg-surface2"
                >
                  <File size={16} className="shrink-0 text-muted" />
                  <span className="min-w-0 flex-1 truncate font-mono">{file.originalName}</span>
                  <span className="shrink-0 font-mono text-xs text-muted">{formatBytes(file.sizeBytes)}</span>
                  <Download size={14} className="shrink-0 text-muted" />
                </a>
              ))}
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
