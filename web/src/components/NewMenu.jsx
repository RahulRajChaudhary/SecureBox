import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FilePlus, FolderPlus, Plus, Upload } from 'lucide-react';
import { scaleIn, quick } from '../lib/motion';

export function NewMenu({ onNewFolder, onUploadFiles }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    function handlePointer(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    }
    function handleKey(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handlePointer);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handlePointer);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  return (
    <div className="relative px-2.5 py-2" ref={menuRef}>
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-center gap-1.5 rounded-full bg-accent px-3 py-2 text-sm font-semibold text-bg transition-colors hover:bg-accent-dim"
      >
        <Plus size={16} />
        New
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            variants={scaleIn}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={quick}
            style={{ transformOrigin: 'top left' }}
            className="absolute left-2.5 z-20 mt-1 w-44 rounded-md border border-edge bg-surface2 py-1 shadow-xl"
          >
            <button
              onClick={() => {
                onNewFolder();
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-muted hover:bg-surface hover:text-ink"
            >
              <FolderPlus size={14} /> New folder
            </button>
            <button
              onClick={() => {
                fileInputRef.current?.click();
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-muted hover:bg-surface hover:text-ink"
            >
              <FilePlus size={14} /> Upload files
            </button>
            <button
              onClick={() => {
                folderInputRef.current?.click();
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-muted hover:bg-surface hover:text-ink"
            >
              <Upload size={14} /> Upload folder
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files.length) onUploadFiles(e.target.files);
          e.target.value = '';
        }}
      />
      {/* webkitdirectory has no cross-browser standard equivalent; unsupported
          browsers just fall back to a normal multi-file picker. */}
      <input
        ref={folderInputRef}
        type="file"
        multiple
        webkitdirectory=""
        className="hidden"
        onChange={(e) => {
          if (e.target.files.length) onUploadFiles(e.target.files);
          e.target.value = '';
        }}
      />
    </div>
  );
}
