import { motion } from 'framer-motion';
import { Lock, ShieldCheck, Share2, UploadCloud } from 'lucide-react';
import { fadeUp, quick, staggerContainer, staggerItem } from '../lib/motion';

const FEATURES = [
  { icon: UploadCloud, title: 'Resumable multipart', detail: 'Uploads up to 5GB, resume anytime.' },
  { icon: Lock, title: 'Direct to S3', detail: 'Bytes never touch our API servers.' },
  { icon: Share2, title: 'Private by default', detail: 'Share via link only when you want.' },
];

export function AuthLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-bg">
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden border-r border-edge bg-surface p-10 md:flex">
        <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-accent/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 -right-20 h-72 w-72 rounded-full bg-accent/5 blur-3xl" />

        <motion.div
          variants={fadeUp}
          initial="initial"
          animate="animate"
          transition={quick}
          className="relative flex items-center gap-2 font-mono text-sm font-semibold text-ink"
        >
          <ShieldCheck size={20} className="text-accent" />
          SecureBox
        </motion.div>

        <motion.div variants={staggerContainer} initial="initial" animate="animate" className="relative flex flex-col gap-6">
          <motion.div variants={staggerItem} transition={quick} className="flex flex-col gap-3">
            <p className="max-w-sm font-mono text-3xl font-semibold leading-snug tracking-tight text-ink">
              Direct-to-S3 uploads.
              <br />
              Private by default.
            </p>
            <p className="max-w-sm text-sm text-muted">
              Every file streams straight to S3 in resumable, multipart chunks — private by
              default, sharable the moment you choose.
            </p>
          </motion.div>

          <ul className="flex flex-col gap-2.5">
            {FEATURES.map(({ icon: Icon, title, detail }) => (
              <motion.li
                key={title}
                variants={staggerItem}
                transition={quick}
                className="flex items-start gap-3 rounded-lg border border-edge bg-surface2 p-3"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-accent/10 text-accent">
                  <Icon size={16} />
                </div>
                <div className="flex flex-col gap-0.5">
                  <p className="text-sm font-medium text-ink">{title}</p>
                  <p className="text-xs text-muted">{detail}</p>
                </div>
              </motion.li>
            ))}
          </ul>
        </motion.div>

        <div className="pointer-events-none absolute right-10 top-24 hidden lg:block" aria-hidden="true">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3, ...quick }}>
            <div className="animate-float rounded-lg border border-edge bg-surface2 px-3 py-2 shadow-xl shadow-black/30">
              <div className="flex items-center gap-2">
                <Lock size={13} className="text-accent" />
                <span className="font-mono text-xs text-ink">contract.pdf</span>
              </div>
              <p className="mt-1 text-[11px] text-muted">Private · shared with 1 link</p>
            </div>
          </motion.div>
        </div>

        <motion.p
          variants={fadeUp}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.2, ...quick }}
          className="relative font-mono text-xs text-muted"
        >
          resumable · multipart · presigned
        </motion.p>
      </div>

      <div className="flex w-full flex-col items-center justify-center px-4 py-16 md:w-1/2">
        <div className="mb-5 flex items-center gap-2 font-mono text-sm font-semibold text-ink md:hidden">
          <ShieldCheck size={18} className="text-accent" />
          SecureBox
        </div>
        {children}
      </div>
    </div>
  );
}
