import { FolderInput, Trash2, X } from 'lucide-react';

export function BulkActionBar({ count, onMove, onDelete, onClear }) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-accent/30 bg-accent/10 px-3 py-1.5">
      <span className="text-sm font-medium text-ink">{count} selected</span>
      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={onMove}
          className="flex items-center gap-1.5 rounded-md border border-edge bg-surface px-3 py-1.5 text-sm text-ink transition-colors hover:bg-surface2"
        >
          <FolderInput size={14} />
          Move to
        </button>
        <button
          onClick={onDelete}
          className="flex items-center gap-1.5 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-sm text-red-400 transition-colors hover:bg-red-500/20"
        >
          <Trash2 size={14} />
          Delete
        </button>
        <button
          onClick={onClear}
          title="Clear selection"
          className="rounded-md p-1.5 text-muted transition-colors hover:bg-surface2 hover:text-ink"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
