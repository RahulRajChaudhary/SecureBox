import { useState } from 'react';
import { Layout } from '../components/Layout';
import { UploadZone } from '../components/UploadZone';
import { UploadQueue } from '../components/UploadQueue';
import { FileList } from '../components/FileList';

export function Dashboard() {
  const [q, setQ] = useState('');
  const [sort, setSort] = useState('createdAt_desc');

  return (
    <Layout>
      <div className="flex flex-col gap-6">
        <h1 className="text-lg font-semibold text-ink">Your files</h1>
        <UploadZone />
        <UploadQueue />

        <div className="flex items-center justify-between gap-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search files…"
            className="w-full max-w-xs rounded-md border border-edge bg-surface px-3 py-1.5 text-sm text-ink outline-none transition-colors placeholder:text-muted focus:border-accent"
          />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="rounded-md border border-edge bg-surface px-2 py-1.5 text-sm text-muted outline-none transition-colors focus:border-accent"
          >
            <option value="createdAt_desc">Newest first</option>
            <option value="createdAt_asc">Oldest first</option>
            <option value="name_asc">Name A–Z</option>
            <option value="name_desc">Name Z–A</option>
          </select>
        </div>

        <FileList q={q} sort={sort} />
      </div>
    </Layout>
  );
}
