import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { FileQuestion, Globe, Star, X } from 'lucide-react';
import { getZipContents } from '../lib/files';
import { backdropFade, scaleIn, quick } from '../lib/motion';
import { formatBytes, formatDate } from '../lib/format';
import { locationLabel } from '../lib/locationLabel';
import { useFolder } from '../hooks/useFolders';
import { ZipTree } from './ZipTree';
import { useResolvedUrl } from '../hooks/useResolvedUrl';

const TEXT_MIME_TYPES = new Set(['text/plain', 'text/csv', 'text/markdown', 'application/json']);
const TEXT_PREVIEW_LIMIT = 100_000; // don't render huge text files inline

function getPreviewKind(mimeType = '') {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType === 'application/pdf') return 'pdf';
  if (mimeType === 'application/zip') return 'zip';
  if (TEXT_MIME_TYPES.has(mimeType)) return 'text';
  return 'unsupported';
}

function Loading() {
  return <p className="py-12 text-center text-sm text-muted">Loading…</p>;
}

function LoadError({ message = 'Could not load preview.' }) {
  return <p className="py-12 text-center text-sm text-red-400">{message}</p>;
}

function MediaPreview({ fileId, kind, name }) {
  const { data: url, isLoading, isError } = useResolvedUrl(fileId, true);
  if (isLoading) return <Loading />;
  if (isError) return <LoadError />;
  if (kind === 'image') return <img src={url} alt={name} className="mx-auto max-h-[60vh] rounded-md" />;
  if (kind === 'video') return <video src={url} controls className="mx-auto max-h-[60vh] w-full rounded-md" />;
  if (kind === 'audio') return <audio src={url} controls className="w-full" />;
  return <iframe title={name} src={url} className="h-[60vh] w-full rounded-md border border-edge" />;
}

function TextPreview({ fileId }) {
  const { data: url, isLoading: resolving } = useResolvedUrl(fileId, true);
  const {
    data: text,
    isLoading: fetching,
    isError,
  } = useQuery({
    queryKey: ['preview-text', fileId, url],
    queryFn: async () => {
      const res = await fetch(url);
      if (!res.ok) throw new Error('Could not load file');
      const full = await res.text();
      return full.length > TEXT_PREVIEW_LIMIT ? `${full.slice(0, TEXT_PREVIEW_LIMIT)}\n\n… truncated` : full;
    },
    enabled: Boolean(url),
  });

  if (resolving || fetching) return <Loading />;
  if (isError) return <LoadError />;
  return (
    <pre className="max-h-[60vh] overflow-auto whitespace-pre-wrap break-words rounded-md bg-bg p-4 font-mono text-xs text-ink">
      {text}
    </pre>
  );
}

function ZipPreview({ fileId }) {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['preview-zip', fileId],
    queryFn: () => getZipContents(fileId),
  });

  if (isLoading) return <p className="py-12 text-center text-sm text-muted">Reading archive…</p>;
  if (isError) return <LoadError message={error?.message ?? 'Could not read archive contents.'} />;

  const { entries, truncated } = data.data;
  if (entries.length === 0) return <p className="py-12 text-center text-sm text-muted">Archive is empty.</p>;

  return (
    <div className="max-h-[60vh] overflow-auto rounded-md bg-bg p-3">
      <ZipTree entries={entries} />
      {truncated && (
        <p className="mt-2 text-xs text-muted">Showing a partial listing — this archive has a lot of entries.</p>
      )}
    </div>
  );
}

function PreviewInfo({ file }) {
  const { data } = useFolder(file.folderId);
  const crumbs = data?.data?.breadcrumb ?? [];

  const rows = [
    ['Type', file.mimeType || 'Unknown'],
    ['Size', formatBytes(file.sizeBytes)],
    ['Location', locationLabel(file.folderId, crumbs)],
    ['Created', formatDate(file.createdAt)],
    ['Modified', formatDate(file.updatedAt)],
  ];

  return (
    <div className="mt-4 shrink-0 border-t border-edge pt-4">
      <div className="mb-2 flex items-center gap-2">
        {file.isFavorite && <Star size={13} className="fill-warn text-warn" title="Favorite" />}
        {file.visibility === 'PUBLIC' && <Globe size={13} className="text-warn" title="Public" />}
      </div>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="text-muted">{label}</dt>
            <dd className="truncate font-mono text-ink">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function PreviewModal({ file, onClose }) {
  const kind = getPreviewKind(file.mimeType);

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
        className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-lg border border-edge bg-surface p-5 shadow-2xl"
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="truncate font-mono text-sm font-medium text-ink">{file.originalName}</p>
          <button
            onClick={onClose}
            className="shrink-0 rounded-md p-1.5 text-muted transition-colors hover:bg-surface2 hover:text-ink"
          >
            <X size={16} />
          </button>
        </div>

        <div className="min-h-[120px] flex-1 overflow-auto">
          {(kind === 'image' || kind === 'video' || kind === 'audio' || kind === 'pdf') && (
            <MediaPreview fileId={file.id} kind={kind} name={file.originalName} />
          )}
          {kind === 'text' && <TextPreview fileId={file.id} />}
          {kind === 'zip' && <ZipPreview fileId={file.id} />}
          {kind === 'unsupported' && (
            <div className="flex flex-col items-center gap-2 py-16 text-muted">
              <FileQuestion size={28} />
              <p className="text-sm">No preview available — download to view.</p>
            </div>
          )}

          <PreviewInfo file={file} />
        </div>
      </motion.div>
    </motion.div>
  );
}
