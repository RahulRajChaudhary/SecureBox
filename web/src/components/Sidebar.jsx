import { Clock3, FolderOpen, Trash2 } from 'lucide-react';
import { NewMenu } from './NewMenu';
import { formatBytes } from '../lib/format';

const NAV_ITEMS = [
  { key: 'files', label: 'My Files', icon: FolderOpen },
  { key: 'recent', label: 'Recent', icon: Clock3 },
  { key: 'trash', label: 'Trash', icon: Trash2 },
];

export function Sidebar({ nav, onNavChange, onNewFolder, onUploadFiles, usedBytes, limitBytes }) {
  const usedNum = Number(usedBytes ?? 0);
  const pct = limitBytes ? Math.min(100, (usedNum / limitBytes) * 100) : 0;
  const barColor = pct >= 95 ? 'bg-red-400' : pct >= 80 ? 'bg-warn' : 'bg-accent';

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-edge bg-surface">
      <NewMenu onNewFolder={onNewFolder} onUploadFiles={onUploadFiles} />

      <nav className="flex flex-col gap-0.5 px-2">
        {NAV_ITEMS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => onNavChange(key)}
            className={`flex items-center gap-2.5 rounded-full px-3 py-2 text-left text-sm transition-colors ${
              nav === key ? 'bg-accent/15 font-medium text-accent' : 'text-muted hover:bg-surface2 hover:text-ink'
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </nav>

      <div className="mt-auto border-t border-edge px-3 py-3">
        {usedBytes != null && limitBytes != null && (
          <>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface2">
              <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
            </div>
            <p className="mt-1.5 font-mono text-xs text-muted">
              {formatBytes(usedBytes)} of {formatBytes(limitBytes)} used
            </p>
          </>
        )}
      </div>
    </aside>
  );
}
