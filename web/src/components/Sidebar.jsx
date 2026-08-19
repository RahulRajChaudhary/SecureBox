import { Clock3, Globe, PieChart, Trash2 } from 'lucide-react';
import { NewMenu } from './NewMenu';
import { FolderTree } from './FolderTree';

const QUICK_LINKS = [
  { key: 'recent', label: 'Recent', icon: Clock3 },
  { key: 'shared', label: 'Shared', icon: Globe },
  { key: 'stats', label: 'Stats', icon: PieChart },
  { key: 'trash', label: 'Trash', icon: Trash2 },
];

export function Sidebar({ nav, onNavChange, activeFolderId, onOpenFolder, onNewFolder, onUploadFiles }) {
  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-edge bg-surface">
      <NewMenu onNewFolder={onNewFolder} onUploadFiles={onUploadFiles} />

      <div className="flex-1 overflow-y-auto px-2">
        <FolderTree activeFolderId={nav === 'files' ? activeFolderId : undefined} onOpen={onOpenFolder} />

        <nav className="mt-4 flex flex-col gap-0.5 border-t border-edge pt-3">
          {QUICK_LINKS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => onNavChange(key)}
              className={`flex items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm transition-colors ${
                nav === key ? 'bg-accent/15 font-medium text-accent' : 'text-muted hover:bg-surface2 hover:text-ink'
              }`}
            >
              <Icon size={15} />
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
