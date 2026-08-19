import { useState } from 'react';
import { ChevronRight, Folder } from 'lucide-react';
import { useFolders } from '../hooks/useFolders';

function FolderTreeNode({ folder, activeFolderId, onOpen }) {
  const [expanded, setExpanded] = useState(false);
  const hasChildren = folder.subfolderCount > 0;
  const { data } = useFolders(folder.id, { enabled: expanded });
  const children = data?.data ?? [];
  const isActive = activeFolderId === folder.id;

  return (
    <div>
      <div
        onClick={() => onOpen(folder.id)}
        className={`flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1.5 text-sm transition-colors ${
          isActive ? 'bg-accent/15 font-medium text-accent' : 'text-muted hover:bg-surface2 hover:text-ink'
        }`}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (hasChildren) setExpanded((v) => !v);
          }}
          className={`flex h-4 w-4 shrink-0 items-center justify-center text-muted transition-transform ${
            expanded ? 'rotate-90' : ''
          } ${hasChildren ? '' : 'invisible'}`}
        >
          <ChevronRight size={12} />
        </button>
        <Folder size={14} className="shrink-0 text-warn" />
        <span className="min-w-0 flex-1 truncate">{folder.name}</span>
        <span className="shrink-0 text-xs text-muted">{folder.subfolderCount + folder.fileCount}</span>
      </div>

      {expanded && children.length > 0 && (
        <div className="ml-3 flex flex-col gap-0.5 border-l border-edge pl-3">
          {children.map((child) => (
            <FolderTreeNode key={child.id} folder={child} activeFolderId={activeFolderId} onOpen={onOpen} />
          ))}
        </div>
      )}
    </div>
  );
}

export function FolderTree({ activeFolderId, onOpen }) {
  const [rootExpanded, setRootExpanded] = useState(true);
  const { data, isLoading } = useFolders(null, { enabled: rootExpanded });
  const folders = data?.data ?? [];
  const isRootActive = activeFolderId === null;

  return (
    <nav className="flex flex-col gap-0.5" aria-label="Folders">
      <div
        onClick={() => onOpen(null)}
        className={`flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1.5 text-sm transition-colors ${
          isRootActive ? 'bg-accent/15 font-medium text-accent' : 'text-ink hover:bg-surface2'
        }`}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            setRootExpanded((v) => !v);
          }}
          className={`flex h-4 w-4 shrink-0 items-center justify-center text-muted transition-transform ${
            rootExpanded ? 'rotate-90' : ''
          }`}
        >
          <ChevronRight size={12} />
        </button>
        <Folder size={14} className="shrink-0 text-warn" />
        <span className="min-w-0 flex-1 truncate">My Files</span>
      </div>

      {rootExpanded && !isLoading && folders.length > 0 && (
        <div className="ml-3 flex flex-col gap-0.5 border-l border-edge pl-3">
          {folders.map((folder) => (
            <FolderTreeNode key={folder.id} folder={folder} activeFolderId={activeFolderId} onOpen={onOpen} />
          ))}
        </div>
      )}
    </nav>
  );
}
