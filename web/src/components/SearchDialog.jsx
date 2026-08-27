import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { File, Folder, Search } from 'lucide-react';
import { useFiles } from '../hooks/useFiles';
import { useFolders } from '../hooks/useFolders';
import { sortEntries } from '../lib/sortEntries';
import { backdropFade, scaleIn, quick } from '../lib/motion';

// Ctrl+K / Cmd+K quick-jump: whole-drive search across files and folders,
// independent of the header's inline search box (which stays a live filter
// scoped to whatever view you're currently browsing).
export function SearchDialog({ onClose, onSelect }) {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);
  const hasQuery = query.trim().length > 0;

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const { data: fileData } = useFiles({ q: query, sort: 'name_asc', enabled: hasQuery });
  const { data: folderData } = useFolders(undefined, { q: query, enabled: hasQuery });
  const files = fileData?.pages?.[0]?.data ?? [];
  const folders = folderData?.data ?? [];
  const entries = hasQuery ? sortEntries(folders, files, 'name_asc') : [];

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    setActiveIndex((i) => Math.min(i, Math.max(entries.length - 1, 0)));
  }, [entries.length]);

  function handleKeyDown(e) {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, entries.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const entry = entries[activeIndex];
      if (entry) onSelect(entry);
    }
  }

  return (
    <motion.div
      variants={backdropFade}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={quick}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 pt-24"
    >
      <motion.div
        variants={scaleIn}
        transition={quick}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg overflow-hidden rounded-lg border border-edge bg-surface shadow-2xl"
      >
        <div className="relative border-b border-edge">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search files and folders…"
            className="w-full bg-transparent py-3 pl-9 pr-3 text-sm text-ink outline-none placeholder:text-muted"
          />
        </div>
        <div className="max-h-80 overflow-y-auto p-1.5">
          {!hasQuery ? (
            <p className="px-3 py-6 text-center text-xs text-muted">Start typing to search your drive.</p>
          ) : entries.length === 0 ? (
            <p className="px-3 py-6 text-center text-xs text-muted">Nothing matches your search.</p>
          ) : (
            entries.map((entry, index) => {
              const key = entry.type === 'folder' ? `folder-${entry.folder.id}` : `file-${entry.file.id}`;
              const active = index === activeIndex;
              return (
                <button
                  key={key}
                  type="button"
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => onSelect(entry)}
                  className={`flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm transition-colors ${
                    active ? 'bg-surface2 text-ink' : 'text-muted hover:bg-surface2 hover:text-ink'
                  }`}
                >
                  {entry.type === 'folder' ? (
                    <Folder size={15} className="shrink-0" />
                  ) : (
                    <File size={15} className="shrink-0" />
                  )}
                  <span className="truncate font-mono text-xs">{entry.name}</span>
                </button>
              );
            })
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
