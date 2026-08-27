import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { Upload, FolderPlus } from 'lucide-react';
import { Layout } from '../components/Layout';
import { UploadQueue } from '../components/UploadQueue';
import { FileList } from '../components/FileList';
import { FileGrid } from '../components/FileGrid';
import { Breadcrumb } from '../components/Breadcrumb';
import { NewFolderModal } from '../components/NewFolderModal';
import { TrashList } from '../components/TrashList';
import { ViewToggle } from '../components/ViewToggle';
import { DropOverlay } from '../components/DropOverlay';
import { BulkActionBar } from '../components/BulkActionBar';
import { BulkMoveModal } from '../components/BulkMoveModal';
import { DeleteConfirm } from '../components/DeleteConfirm';
import { SearchDialog } from '../components/SearchDialog';
import { PreviewModal } from '../components/PreviewModal';
import { useCreateFolder, useFolders, useFavoriteFolders, useDeleteFolder } from '../hooks/useFolders';
import { useUploadFiles } from '../hooks/useUploadFiles';
import { useStats, useDeleteFile } from '../hooks/useFiles';
import { DashboardStats } from '../components/DashboardStats';
import { StorageBreakdown } from '../components/StorageBreakdown';

const VIEW_MODE_KEY = 'securebox:viewMode';
const NAV_TITLES = { recent: 'Recent', shared: 'Shared', favorites: 'Favorites' };
const NAV_EMPTY_MESSAGES = {
  recent: 'Nothing here yet — recently used files show up here.',
  shared: "Files you've shared publicly will show up here.",
  favorites: "Files and folders you've starred show up here.",
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
  const [nav, setNav] = useState('files'); // 'files' | 'recent' | 'shared' | 'favorites' | 'stats' | 'trash'
  const { folderId: folderIdParam } = useParams();
  const navigate = useNavigate();
  const folderId = folderIdParam ?? null;
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [viewMode, setViewMode] = useState(readViewMode);
  const [filesFilter, setFilesFilter] = useState('all'); // 'all' | 'folders' — only meaningful for nav === 'files'
  const [selected, setSelected] = useState(new Set()); // Set of "file:<id>" | "folder:<id>"
  const [bulkMoving, setBulkMoving] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const createFolder = useCreateFolder();
  const deleteFile = useDeleteFile();
  const deleteFolder = useDeleteFolder();
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
    setSelected(new Set());
    if (next === 'files') navigate('/dashboard');
  }

  function handleOpenFolder(id) {
    setNav('files');
    setQ('');
    setSelected(new Set());
    navigate(id ? `/dashboard/folder/${id}` : '/dashboard');
  }

  function handleSearchSelect(entry) {
    setSearchDialogOpen(false);
    if (entry.type === 'folder') {
      handleOpenFolder(entry.folder.id);
    } else {
      handleOpenFolder(entry.file.folderId);
      setPreviewFile(entry.file);
    }
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

  function toggleSelect(type, id) {
    setSelected((prev) => {
      const next = new Set(prev);
      const key = `${type}:${id}`;
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function handleSelectAll(currentFolders, currentFiles) {
    const keys = [...currentFolders.map((f) => `folder:${f.id}`), ...currentFiles.map((f) => `file:${f.id}`)];
    const allSelected = keys.length > 0 && keys.every((k) => selected.has(k));
    setSelected(allSelected ? new Set() : new Set(keys));
  }

  const selectedEntries = [...selected].map((key) => {
    const [type, id] = key.split(':');
    return { type, id };
  });

  async function handleBulkDelete() {
    const results = await Promise.allSettled(
      selectedEntries.map((e) => (e.type === 'file' ? deleteFile.mutateAsync(e.id) : deleteFolder.mutateAsync(e.id))),
    );
    const failed = results.filter((r) => r.status === 'rejected').length;
    const succeeded = results.length - failed;
    if (succeeded) toast.success(`Deleted ${succeeded} item${succeeded !== 1 ? 's' : ''}`);
    if (failed) toast.error(`${failed} item${failed !== 1 ? 's' : ''} could not be deleted`);
    setSelected(new Set());
    setBulkDeleting(false);
  }

  const showFilesFilter = nav === 'files' || nav === 'recent' || nav === 'favorites';
  const isFoldersOnly = showFilesFilter && filesFilter === 'folders';

  // Folder search mirrors file search: whole-drive, case-insensitive
  // substring match on name, regardless of the currently open folder. The
  // backend does the filtering (via q), so folders show for nav === 'files'
  // whether or not q is set.
  const showFolders = nav === 'files' || nav === 'favorites';
  const { data: folderList } = useFolders(folderId, { q, enabled: nav === 'files' });
  const { data: favoriteFolderList } = useFavoriteFolders({ enabled: nav === 'favorites' });
  const rawFolders = nav === 'files' ? (folderList?.data ?? []) : nav === 'favorites' ? (favoriteFolderList?.data ?? []) : [];
  const folders = showFolders ? rawFolders : [];

  const listProps = {
    folders,
    onOpenFolder: handleOpenFolder,
    filesEnabled: !isFoldersOnly,
    q,
    sort,
    folderId: nav === 'files' ? folderId : undefined,
    view: nav === 'recent' ? 'recent' : nav === 'shared' ? 'shared' : nav === 'favorites' ? 'favorites' : undefined,
    emptyMessage: q ? 'Nothing matches your search.' : (NAV_EMPTY_MESSAGES[nav] ?? (folderId ? 'This folder is empty.' : undefined)),
    selected,
    onToggleSelect: toggleSelect,
    onSelectAll: handleSelectAll,
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
      onOpenSearch={() => setSearchDialogOpen(true)}
    >
      <DropOverlay onDrop={uploadFiles}>
        <div className="flex flex-col gap-6">
          {nav === 'trash' ? (
            <TrashList />
          ) : nav === 'stats' ? (
            <StatsView stats={stats} isLoading={statsLoading} />
          ) : (
            <>
              {selected.size > 0 ? (
                <BulkActionBar
                  count={selected.size}
                  onMove={() => setBulkMoving(true)}
                  onDelete={() => setBulkDeleting(true)}
                  onClear={() => setSelected(new Set())}
                />
              ) : (
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
              )}

              <div className="flex items-center justify-between gap-3">
                {nav === 'files' ? (
                  <Breadcrumb
                    folderId={folderId}
                    onNavigate={(id) => navigate(id ? `/dashboard/folder/${id}` : '/dashboard')}
                  />
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

              {nav === 'recent' && isFoldersOnly ? (
                <p className="py-8 text-center text-sm text-muted">
                  Recent only tracks files — folders don't show up here.
                </p>
              ) : viewMode === 'grid' ? (
                <FileGrid {...listProps} />
              ) : (
                <FileList {...listProps} />
              )}
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
            {bulkMoving && <BulkMoveModal entries={selectedEntries} onClose={() => setBulkMoving(false)} />}
            {bulkDeleting && (
              <DeleteConfirm
                title="Delete items"
                message={`Delete ${selected.size} item${selected.size !== 1 ? 's' : ''}? This can't be undone.`}
                onConfirm={handleBulkDelete}
                onClose={() => setBulkDeleting(false)}
                deleting={deleteFile.isPending || deleteFolder.isPending}
              />
            )}
            {searchDialogOpen && (
              <SearchDialog onClose={() => setSearchDialogOpen(false)} onSelect={handleSearchSelect} />
            )}
            {previewFile && <PreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />}
          </AnimatePresence>
        </div>
      </DropOverlay>
      <UploadQueue />
    </Layout>
  );
}
