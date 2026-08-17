import { ShieldCheck } from 'lucide-react';

const FEATURES = [
  'Resumable multipart uploads, up to 5GB',
  'Bytes go straight to S3 — the API never touches your file',
  'Private by default, share via link when you want',
];

export function AuthLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-bg">
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden border-r border-edge bg-surface p-10 md:flex">
        <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-accent/10 blur-3xl" />

        <div className="relative flex items-center gap-2 font-mono text-sm font-semibold text-ink">
          <ShieldCheck size={20} className="text-accent" />
          SecureBox
        </div>

        <div className="relative flex flex-col gap-6">
          <p className="max-w-xs font-mono text-2xl leading-snug text-ink">
            Direct-to-S3 uploads.
            <br />
            Private by default.
          </p>
          <ul className="flex flex-col gap-3 text-sm text-muted">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-accent" />
                {f}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative font-mono text-xs text-muted">resumable · multipart · presigned</p>
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
