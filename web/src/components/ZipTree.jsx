import { useState } from 'react';
import { ChevronRight, File as FileIcon, Folder } from 'lucide-react';
import { formatBytes } from '../lib/format';

function ZipNode({ node, depth }) {
  const [open, setOpen] = useState(depth < 1);

  if (node.type === 'file') {
    return (
      <div className="flex items-center gap-2 py-1 text-sm text-ink" style={{ paddingLeft: depth * 16 }}>
        <FileIcon size={14} className="shrink-0 text-muted" />
        <span className="truncate font-mono">{node.name}</span>
        <span className="ml-auto shrink-0 font-mono text-xs text-muted">{formatBytes(node.sizeBytes)}</span>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-1 py-1 text-sm text-ink hover:text-accent"
        style={{ paddingLeft: depth * 16 }}
      >
        <ChevronRight size={14} className={`shrink-0 transition-transform ${open ? 'rotate-90' : ''}`} />
        <Folder size={14} className="shrink-0 text-muted" />
        <span className="truncate font-mono">{node.name}</span>
      </button>
      {open && node.children.map((child) => <ZipNode key={child.name} node={child} depth={depth + 1} />)}
    </div>
  );
}

export function ZipTree({ entries }) {
  return (
    <div>
      {entries.map((entry) => (
        <ZipNode key={entry.name} node={entry} depth={0} />
      ))}
    </div>
  );
}
