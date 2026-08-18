import { LayoutGrid, List } from 'lucide-react';

export function ViewToggle({ mode, onChange }) {
  return (
    <div className="flex items-center gap-0.5 rounded-md border border-edge bg-surface p-0.5">
      <button
        onClick={() => onChange('grid')}
        className={`rounded p-1.5 transition-colors ${
          mode === 'grid' ? 'bg-surface2 text-ink' : 'text-muted hover:text-ink'
        }`}
        title="Grid view"
      >
        <LayoutGrid size={15} />
      </button>
      <button
        onClick={() => onChange('list')}
        className={`rounded p-1.5 transition-colors ${
          mode === 'list' ? 'bg-surface2 text-ink' : 'text-muted hover:text-ink'
        }`}
        title="List view"
      >
        <List size={15} />
      </button>
    </div>
  );
}
