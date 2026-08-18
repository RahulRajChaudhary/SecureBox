import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { UploadCloud } from 'lucide-react';

export function DropOverlay({ onDrop, children }) {
  const [dragging, setDragging] = useState(false);
  const [depth, setDepth] = useState(0);

  // A drag over nested children fires dragenter/dragleave on each element as
  // the pointer crosses their boundaries — a depth counter (instead of a
  // single boolean) is what keeps the overlay from flickering during that.
  function handleDragEnter(e) {
    e.preventDefault();
    setDepth((d) => d + 1);
    setDragging(true);
  }

  function handleDragLeave(e) {
    e.preventDefault();
    setDepth((d) => {
      const next = d - 1;
      if (next <= 0) setDragging(false);
      return next;
    });
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    setDepth(0);
    if (e.dataTransfer.files.length) onDrop(e.dataTransfer.files);
  }

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="relative"
    >
      {children}
      <AnimatePresence>
        {dragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center border-4 border-dashed border-accent bg-bg/80"
          >
            <div className="flex flex-col items-center gap-2 text-accent">
              <UploadCloud size={40} />
              <p className="text-sm font-medium">Drop to upload</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
