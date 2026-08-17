import { motion } from 'framer-motion';
import { LogOut, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { fadeUp, quick } from '../lib/motion';

export function Layout({ children }) {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-bg">
      <header className="border-b border-edge bg-surface/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2 font-mono text-sm font-semibold tracking-tight text-ink">
            <ShieldCheck size={18} className="text-accent" />
            SecureBox
          </div>
          <div className="flex items-center gap-4 text-sm text-muted">
            <span className="font-mono text-xs">{user?.email}</span>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 rounded-md px-2 py-1 text-muted transition-colors hover:bg-surface2 hover:text-ink"
            >
              <LogOut size={15} />
              Log out
            </button>
          </div>
        </div>
      </header>
      <motion.main
        initial={fadeUp.initial}
        animate={fadeUp.animate}
        transition={quick}
        className="mx-auto max-w-5xl px-6 py-8"
      >
        {children}
      </motion.main>
    </div>
  );
}
