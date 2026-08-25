import { Clock3, Globe, Home, PieChart, Star, Trash2 } from 'lucide-react';
import { NewMenu } from './NewMenu';

const QUICK_LINKS = [
  { key: 'recent', label: 'Recent', icon: Clock3 },
  { key: 'shared', label: 'Shared', icon: Globe },
  { key: 'favorites', label: 'Favorites', icon: Star },
  { key: 'stats', label: 'Stats', icon: PieChart },
  { key: 'trash', label: 'Trash', icon: Trash2 },
];

export function Sidebar({ nav, onNavChange, activeFolderId, onOpenFolder, onNewFolder, onUploadFiles }) {
  const isHomeActive = nav === 'files' && activeFolderId === null;

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-edge bg-surface">
      <NewMenu onNewFolder={onNewFolder} onUploadFiles={onUploadFiles} />

      {/* Flat list — no nested folder browsing here; that happens in the
          main content area via folder cards/rows + breadcrumb. */}
      <div className="flex-1 overflow-y-auto px-3">
        <nav className="flex flex-col gap-1">
          <button
            onClick={() => onOpenFolder(null)}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors hover:bg-surface2 ${
              isHomeActive ? 'font-semibold text-accent' : 'text-muted hover:text-ink'
            }`}
          >
            <Home size={16} />
            Home
          </button>

          {QUICK_LINKS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => onNavChange(key)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                nav === key ? 'bg-accent font-semibold text-bg' : 'text-muted hover:bg-surface2 hover:text-ink'
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </nav>
      </div>

      <div className="flex flex-col gap-1.5 border-t border-edge px-3 py-3 text-xs text-muted">
        <div className="flex gap-3">
          <span>Privacy policy</span>
          <span>Terms of use</span>
        </div>
        <span>© {new Date().getFullYear()} SecureBox</span>
      </div>
    </aside>
  );
}
