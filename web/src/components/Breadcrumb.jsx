import { ChevronRight, Home } from 'lucide-react';
import { useFolder } from '../hooks/useFolders';

export function Breadcrumb({ folderId, onNavigate }) {
  const { data } = useFolder(folderId);
  const crumbs = data?.data?.breadcrumb ?? [];

  return (
    <div className="flex flex-wrap items-center gap-1 text-sm">
      <button
        onClick={() => onNavigate(null)}
        className={`flex items-center gap-1 rounded-md px-2 py-1 transition-colors hover:bg-surface2 ${
          folderId ? 'text-muted hover:text-ink' : 'font-medium text-ink'
        }`}
      >
        <Home size={14} />
        My Drive
      </button>
      {crumbs.map((crumb, i) => (
        <span key={crumb.id} className="flex items-center gap-1">
          <ChevronRight size={14} className="text-muted" />
          <button
            onClick={() => onNavigate(crumb.id)}
            className={`rounded-md px-2 py-1 font-mono transition-colors hover:bg-surface2 ${
              i === crumbs.length - 1 ? 'font-medium text-ink' : 'text-muted hover:text-ink'
            }`}
          >
            {crumb.name}
          </button>
        </span>
      ))}
    </div>
  );
}
