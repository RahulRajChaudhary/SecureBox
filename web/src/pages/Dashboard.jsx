import { useState } from 'react';
import { Layout } from '../components/Layout';
import { UploadZone } from '../components/UploadZone';
import { UploadQueue } from '../components/UploadQueue';
import { FileList } from '../components/FileList';
import { TrashList } from '../components/TrashList';

export function Dashboard() {
  const [q, setQ] = useState('');
  const [sort, setSort] = useState('createdAt_desc');
  const [tab, setTab] = useState('files'); // 'files' | 'trash'

  return (
    <Layout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-1 border-b border-edge">
          {[
            ['files', 'Your files'],
            ['trash', 'Trash'],
          ].map(([value, label]) => (
            <button
              key={value}
              onClick={() => setTab(value)}
              className={`-mb-px border-b-2 px-1 pb-2 text-sm font-medium transition-colors ${
                tab === value
                  ? 'border-accent text-ink'
                  : 'border-transparent text-muted hover:text-ink'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'files' ? (
          <>
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
          </>
        ) : (
          <TrashList />
        )}
      </div>
    </Layout>
  );
}
