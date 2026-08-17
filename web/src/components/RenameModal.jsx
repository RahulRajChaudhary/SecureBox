import { useState } from 'react';
import { motion } from 'framer-motion';
import { backdropFade, scaleIn, quick } from '../lib/motion';

export function RenameModal({ initialName, onSave, onClose, saving }) {
  const [name, setName] = useState(initialName);

  function handleSubmit(e) {
    e.preventDefault();
    if (name.trim() && name.trim() !== initialName) onSave(name.trim());
    else onClose();
  }

  return (
    <motion.div
      variants={backdropFade}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={quick}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    >
      <motion.form
        variants={scaleIn}
        transition={quick}
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-lg border border-edge bg-surface p-5 shadow-2xl"
      >
        <h2 className="mb-3 text-sm font-semibold text-ink">Rename file</h2>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={255}
          className="w-full rounded-md border border-edge bg-bg px-3 py-2 font-mono text-sm text-ink outline-none transition-colors focus:border-accent"
        />
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-3 py-1.5 text-sm text-muted transition-colors hover:bg-surface2 hover:text-ink"
          >
            Cancel
          </button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            type="submit"
            disabled={saving}
            className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-bg transition-colors hover:bg-accent-dim disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save'}
          </motion.button>
        </div>
      </motion.form>
    </motion.div>
  );
}
