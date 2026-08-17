import { motion } from 'framer-motion';
import { Link2 } from 'lucide-react';
import toast from 'react-hot-toast';

export function CopyLinkButton({ slug }) {
  async function handleCopy() {
    const url = `${window.location.origin}/share/${slug}`;
    await navigator.clipboard.writeText(url);
    toast.success('Share link copied');
  }

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={handleCopy}
      className="flex items-center gap-1 rounded-md p-2 text-sm text-muted transition-colors hover:bg-surface2 hover:text-accent sm:px-2 sm:py-1"
      title="Copy share link"
    >
      <Link2 size={15} />
      <span className="hidden sm:inline">Copy link</span>
    </motion.button>
  );
}
