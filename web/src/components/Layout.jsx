import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { HardDrive, Search, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useUsage } from '../hooks/useFiles';
import { Sidebar } from './Sidebar';
import { ProfileMenu } from './ProfileMenu';
import { formatBytes, usagePercent } from '../lib/format';
import { fadeUp, quick } from '../lib/motion';

function StoragePill({ usedBytes, limitBytes }) {
  if (usedBytes == null || limitBytes == null) return null;
  const pct = usagePercent(usedBytes, limitBytes);
  const barColor = pct >= 95 ? 'bg-red-400' : pct >= 80 ? 'bg-warn' : 'bg-accent';

  return (
    <div className="hidden items-center gap-2.5 rounded-full border border-edge bg-surface px-3 py-1.5 sm:flex">
      <HardDrive size={14} className="shrink-0 text-muted" />
      <div className="flex flex-col gap-1">
        <span className="whitespace-nowrap text-xs text-muted">
          <strong className="font-semibold text-ink">{formatBytes(usedBytes)}</strong> of {formatBytes(limitBytes)}{' '}
          used
        </span>
        <div className="h-1 w-full overflow-hidden rounded-full bg-surface2">
          <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  );
}

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPod|iPad/.test(navigator.platform ?? navigator.userAgent);

export function Layout({ children, nav, onNavChange, activeFolderId, onOpenFolder, q, onQChange, onNewFolder, onUploadFiles, onOpenSearch }) {
  const { user, logout, refreshUser } = useAuth();
  const { data: usage } = useUsage();

  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onOpenSearch?.();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onOpenSearch]);

  return (
    <div className="flex h-screen flex-col bg-bg">
      <header className="relative z-30 flex shrink-0 items-center gap-4 border-b border-edge bg-surface/80 px-4 py-3 backdrop-blur">
        <button
          onClick={() => onOpenFolder(null)}
          className="flex shrink-0 items-center gap-2 font-mono text-sm font-semibold tracking-tight text-ink transition-opacity hover:opacity-80"
        >
          <ShieldCheck size={18} className="text-accent" />
          SecureBox
        </button>
        <div className="relative mx-auto w-full max-w-md">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={q}
            onChange={(e) => onQChange(e.target.value)}
            placeholder="Search files and folders…"
            className="w-full rounded-full border border-edge bg-bg py-1.5 pl-9 pr-16 text-sm text-ink outline-none transition-colors placeholder:text-muted focus:border-accent"
          />
          {!q && (
            <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded border border-edge bg-surface px-1.5 py-0.5 font-mono text-[11px] text-muted">
              {isMac ? '⌘K' : 'Ctrl K'}
            </kbd>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <StoragePill usedBytes={usage?.data?.usedBytes} limitBytes={usage?.data?.limitBytes} />
          <ProfileMenu user={user} logout={logout} refreshUser={refreshUser} />
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <Sidebar
          nav={nav}
          onNavChange={onNavChange}
          activeFolderId={activeFolderId}
          onOpenFolder={onOpenFolder}
          onNewFolder={onNewFolder}
          onUploadFiles={onUploadFiles}
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
