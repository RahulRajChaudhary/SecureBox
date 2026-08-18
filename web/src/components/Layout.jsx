import { motion } from 'framer-motion';
import { LogOut, Search, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useUsage } from '../hooks/useFiles';
import { Sidebar } from './Sidebar';
import { fadeUp, quick } from '../lib/motion';

export function Layout({ children, nav, onNavChange, q, onQChange, onNewFolder, onUploadFiles }) {
  const { user, logout } = useAuth();
  const { data: usage } = useUsage();

  return (
    <div className="flex h-screen flex-col bg-bg">
      <header className="flex shrink-0 items-center gap-4 border-b border-edge bg-surface/80 px-4 py-3 backdrop-blur">
        <div className="flex shrink-0 items-center gap-2 font-mono text-sm font-semibold tracking-tight text-ink">
          <ShieldCheck size={18} className="text-accent" />
          SecureBox
        </div>
        <div className="relative mx-auto w-full max-w-md">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={q}
            onChange={(e) => onQChange(e.target.value)}
            placeholder="Search files…"
            className="w-full rounded-full border border-edge bg-bg py-1.5 pl-9 pr-3 text-sm text-ink outline-none transition-colors placeholder:text-muted focus:border-accent"
          />
        </div>
        <div className="flex shrink-0 items-center gap-4 text-sm text-muted">
          <span className="hidden font-mono text-xs sm:inline">{user?.email}</span>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 rounded-md px-2 py-1 text-muted transition-colors hover:bg-surface2 hover:text-ink"
          >
            <LogOut size={15} />
            Log out
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <Sidebar
          nav={nav}
          onNavChange={onNavChange}
          onNewFolder={onNewFolder}
          onUploadFiles={onUploadFiles}
          usedBytes={usage?.data?.usedBytes}
        />
        <motion.main
          initial={fadeUp.initial}
          animate={fadeUp.animate}
          transition={quick}
          className="min-w-0 flex-1 overflow-y-auto px-6 py-6"
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
}
