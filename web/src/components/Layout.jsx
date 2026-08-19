import { motion } from 'framer-motion';
import { Search, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useUsage } from '../hooks/useFiles';
import { Sidebar } from './Sidebar';
import { ProfileMenu } from './ProfileMenu';
import { fadeUp, quick } from '../lib/motion';

export function Layout({ children, nav, onNavChange, q, onQChange, onNewFolder, onUploadFiles }) {
  const { user, logout, refreshUser } = useAuth();
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
        <div className="flex shrink-0 items-center">
          <ProfileMenu user={user} logout={logout} refreshUser={refreshUser} />
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <Sidebar
          nav={nav}
          onNavChange={onNavChange}
          onNewFolder={onNewFolder}
          onUploadFiles={onUploadFiles}
          usedBytes={usage?.data?.usedBytes}
          limitBytes={usage?.data?.limitBytes}
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
