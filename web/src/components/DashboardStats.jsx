import { Files, HardDrive, Globe, UploadCloud } from 'lucide-react';
import { formatBytes, usagePercent } from '../lib/format';

function SkeletonTile({ delay }) {
  return (
    <div
      className="flex h-[86px] animate-pulse flex-col gap-3 rounded-lg border border-edge bg-surface p-4"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="h-3 w-2/3 rounded bg-surface2" />
      <div className="h-5 w-1/2 rounded bg-surface2" />
    </div>
  );
}

function StatTile({ icon: Icon, label, value, sub }) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-edge bg-surface p-4">
      <div className="flex items-center gap-2 text-muted">
        <Icon size={15} />
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className="font-mono text-xl font-semibold text-ink">{value}</p>
      {sub && <p className="text-xs text-muted">{sub}</p>}
    </div>
  );
}

export function DashboardStats({ stats, isLoading }) {
  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <SkeletonTile key={i} delay={i * 80} />
        ))}
      </div>
    );
  }

  const pct = usagePercent(stats.usedBytes, stats.limitBytes);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatTile icon={Files} label="Total files" value={stats.totalFiles} />
      <StatTile
        icon={HardDrive}
        label="Storage used"
        value={formatBytes(stats.usedBytes)}
        sub={`${pct.toFixed(0)}% of ${formatBytes(stats.limitBytes)}`}
      />
      <StatTile
        icon={Globe}
        label="Public links"
        value={stats.publicFileCount}
        sub={stats.publicFileCount === 1 ? 'file shared via link' : 'files shared via link'}
      />
      <StatTile icon={UploadCloud} label="Uploaded" value={stats.recentUploadCount} sub="in the last 7 days" />
    </div>
  );
}
