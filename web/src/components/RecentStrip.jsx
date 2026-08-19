import { useFiles } from '../hooks/useFiles';
import { FileGridCard } from './FileGridCard';

const STRIP_LIMIT = 8;

// Grid, not a horizontally-scrolling row — wrapping onto multiple lines
// avoids the overflow-x-auto container that used to make the 3-dot menu's
// dropdown blow out the scroll box when opened.
export function RecentStrip() {
  const { data, isLoading } = useFiles({ view: 'recent', sort: 'createdAt_desc' });
  const files = (data?.pages?.[0]?.data ?? []).slice(0, STRIP_LIMIT);

  if (isLoading || files.length === 0) return null;

  return (
    <div>
      <h2 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">Recent</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {files.map((file) => (
          <FileGridCard key={file.id} file={file} />
        ))}
      </div>
    </div>
  );
}
