import { useState } from 'react';
import { bucketByCategory } from '../lib/fileCategory';
import { formatBytes } from '../lib/format';

const CATEGORY_COLOR = {
  Documents: 'bg-series-documents',
  Media: 'bg-series-media',
  Archives: 'bg-series-archives',
  Other: 'bg-series-other',
};

export function StorageBreakdown({ byMimeType, usedBytes, isLoading }) {
  const [hovered, setHovered] = useState(null);

  if (isLoading || !byMimeType) {
    return <div className="h-[132px] animate-pulse rounded-lg border border-edge bg-surface" />;
  }

  const buckets = bucketByCategory(byMimeType);
  const total = Number(usedBytes) || buckets.reduce((sum, b) => sum + b.sizeBytes, 0);

  if (total === 0) {
    return (
      <div className="rounded-lg border border-edge bg-surface p-4 text-sm text-muted">
        No files yet — storage breakdown will appear once you upload something.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-edge bg-surface p-4">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted">Storage by type</h2>
        <span className="text-xs text-muted">{formatBytes(total)} total</span>
      </div>

      <div
        className="flex h-3 w-full overflow-hidden rounded-full bg-surface2"
        role="img"
        aria-label={`Storage breakdown: ${buckets
          .map((b) => `${b.category} ${formatBytes(b.sizeBytes)} ${((b.sizeBytes / total) * 100).toFixed(0)}%`)
          .join(', ')}`}
      >
        {buckets
          .filter((b) => b.sizeBytes > 0)
          .map((b) => (
            <div
              key={b.category}
              className={`h-full transition-opacity ${CATEGORY_COLOR[b.category]} ${
                hovered && hovered !== b.category ? 'opacity-50' : ''
              }`}
              style={{ width: `${(b.sizeBytes / total) * 100}%` }}
              onMouseEnter={() => setHovered(b.category)}
              onMouseLeave={() => setHovered(null)}
            />
          ))}
      </div>

      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
        {buckets.map((b) => (
          <li
            key={b.category}
            className={`flex items-center gap-2 text-xs transition-opacity ${
              hovered && hovered !== b.category ? 'opacity-50' : ''
            }`}
            onMouseEnter={() => setHovered(b.category)}
            onMouseLeave={() => setHovered(null)}
          >
            <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${CATEGORY_COLOR[b.category]}`} />
            <span className="font-medium text-ink">{b.category}</span>
            <span className="font-mono text-muted">
              {formatBytes(b.sizeBytes)} · {((b.sizeBytes / total) * 100).toFixed(0)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
