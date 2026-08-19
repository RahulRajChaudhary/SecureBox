import { useEffect, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { Upload, FolderPlus } from 'lucide-react';
import { Layout } from '../components/Layout';
import { UploadQueue } from '../components/UploadQueue';
import { FileList } from '../components/FileList';
import { FileGrid } from '../components/FileGrid';
import { FolderList } from '../components/FolderList';
import { RecentStrip } from '../components/RecentStrip';
import { Breadcrumb } from '../components/Breadcrumb';
import { NewFolderModal } from '../components/NewFolderModal';
import { TrashList } from '../components/TrashList';
import { ViewToggle } from '../components/ViewToggle';
import { DropOverlay } from '../components/DropOverlay';
import { useCreateFolder } from '../hooks/useFolders';
import { useUploadFiles } from '../hooks/useUploadFiles';
import { useStats } from '../hooks/useFiles';
import { DashboardStats } from '../components/DashboardStats';
import { StorageBreakdown } from '../components/StorageBreakdown';

const VIEW_MODE_KEY = 'securebox:viewMode';
const NAV_TITLES = { recent: 'Recent', shared: 'Shared' };
const NAV_EMPTY_MESSAGES = {
  recent: 'Nothing here yet — recently used files show up here.',
  shared: "Files you've shared publicly will show up here.",
};

function StatsView({ stats, isLoading }) {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-sm font-medium text-ink">Stats</h1>
      <DashboardStats stats={stats?.data} isLoading={isLoading} />
      <StorageBreakdown
        byMimeType={stats?.data?.byMimeType}
        usedBytes={stats?.data?.usedBytes}
        isLoading={isLoading}
      />
    </div>
  );
}

function readViewMode() {
  const stored = typeof window !== 'undefined' ? window.localStorage.getItem(VIEW_MODE_KEY) : null;
  return stored === 'list' ? 'list' : 'grid';
}

export function Dashboard() {
  const [q, setQ] = useState('');
  const [sort, setSort] = useState('createdAt_desc');
  const [nav, setNav] = useState('files'); // 'files' | 'recent' | 'shared' | 'stats' | 'trash'
  const [folderId, setFolderId] = useState(null);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [viewMode, setViewMode] = useState(readViewMode);
  const [filesFilter, setFilesFilter] = useState('all'); // 'all' | 'folders' — only meaningful for nav === 'files'
  const createFolder = useCreateFolder();
  const { data: stats, isLoading: statsLoading } = useStats({ enabled: nav === 'stats' });
  const uploadInputRef = useRef(null);

  useEffect(() => {
    window.localStorage.setItem(VIEW_MODE_KEY, viewMode);
  }, [viewMode]);

  const effectiveFolderId = nav === 'files' ? folderId : null;
  const uploadFiles = useUploadFiles(effectiveFolderId);

  function handleNavChange(next) {
    setNav(next);
    setQ('');
    if (next === 'files') setFolderId(null);
  }

  function handleOpenFolder(id) {
    setNav('files');
    setQ('');
    setFolderId(id);
  }

  function handleCreateFolder(name) {
    createFolder.mutate(
      { name, parentId: effectiveFolderId },
      {
        onSuccess: () => setCreatingFolder(false),
        onError: () => toast.error('Could not create folder'),
      },
    );
  }

  const showFilesFilter = nav === 'files' || nav === 'recent';
  const isFoldersOnly = showFilesFilter && filesFilter === 'folders';

  const listProps = {
    q,
    sort,
    folderId: nav === 'files' ? folderId : undefined,
    view: nav === 'recent' ? 'recent' : nav === 'shared' ? 'shared' : undefined,
    emptyMessage: q ? 'No files match your search.' : (NAV_EMPTY_MESSAGES[nav] ?? (folderId ? 'This folder is empty.' : undefined)),
  };

  return (
    <Layout
      nav={nav}
      onNavChange={handleNavChange}
      activeFolderId={folderId}
      onOpenFolder={handleOpenFolder}
      q={q}
      onQChange={setQ}
      onNewFolder={() => setCreatingFolder(true)}
      onUploadFiles={uploadFiles}
    >
      <DropOverlay onDrop={uploadFiles}>
        <div className="flex flex-col gap-6">
          {nav === 'trash' ? (
            <TrashList />
          ) : nav === 'stats' ? (
            <StatsView stats={stats} isLoading={statsLoading} />
          ) : (
            <>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => uploadInputRef.current?.click()}
                  className="flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-sm font-semibold text-bg transition-colors hover:bg-accent-dim"
                >
                  <Upload size={14} />
                  Upload
                </button>
                <button
                  type="button"
                  onClick={() => setCreatingFolder(true)}
                  className="flex items-center gap-1.5 rounded-md border border-edge bg-surface px-3 py-1.5 text-sm text-ink transition-colors hover:bg-surface2"
                >
                  <FolderPlus size={14} />
                  New folder
                </button>
                <input
                  ref={uploadInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files.length) uploadFiles(e.target.files);
                    e.target.value = '';
                  }}
                />
              </div>

              {nav === 'files' && !folderId && !q && !isFoldersOnly && <RecentStrip />}

              <div className="flex items-center justify-between gap-3">
                {nav === 'files' ? (
                  <Breadcrumb folderId={folderId} onNavigate={setFolderId} />
                ) : (
                  <h1 className="text-sm font-medium text-ink">{NAV_TITLES[nav]}</h1>
                )}
                <div className="flex items-center gap-2">
                  {showFilesFilter && (
                    <div className="flex items-center gap-0.5 rounded-md border border-edge bg-surface p-0.5">
                      <button
                        type="button"
                        onClick={() => setFilesFilter('all')}
                        className={`rounded px-2 py-1 text-sm transition-colors ${
                          filesFilter === 'all' ? 'bg-surface2 text-ink' : 'text-muted hover:text-ink'
                        }`}
                      >
                        All Files
                      </button>
                      <button
                        type="button"
                        onClick={() => setFilesFilter('folders')}
                        className={`rounded px-2 py-1 text-sm transition-colors ${
                          filesFilter === 'folders' ? 'bg-surface2 text-ink' : 'text-muted hover:text-ink'
                        }`}
                      >
                        Folders
                      </button>
                    </div>
                  )}
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
                  <ViewToggle mode={viewMode} onChange={setViewMode} />
                </div>
              </div>

              {nav === 'files' && (!q || isFoldersOnly) && (
                <FolderList parentId={folderId} onOpen={setFolderId} viewMode={viewMode} sort={sort} />
              )}

              {nav === 'recent' && isFoldersOnly && (
                <p className="py-8 text-center text-sm text-muted">
                  Recent only tracks files — folders don't show up here.
                </p>
              )}

              {!isFoldersOnly &&
                (viewMode === 'grid' ? <FileGrid {...listProps} /> : <FileList {...listProps} />)}
            </>
          )}

          <AnimatePresence>
            {creatingFolder && (
              <NewFolderModal
                onSave={handleCreateFolder}
                onClose={() => setCreatingFolder(false)}
                saving={createFolder.isPending}
              />
            )}
          </AnimatePresence>
        </div>
      </DropOverlay>
      <UploadQueue />
    </Layout>
  );
}
