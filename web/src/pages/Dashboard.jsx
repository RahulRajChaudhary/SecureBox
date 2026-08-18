import { useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { Layout } from '../components/Layout';
import { UploadQueue } from '../components/UploadQueue';
import { FileList } from '../components/FileList';
import { FileGrid } from '../components/FileGrid';
import { FolderList } from '../components/FolderList';
import { Breadcrumb } from '../components/Breadcrumb';
import { NewFolderModal } from '../components/NewFolderModal';
import { TrashList } from '../components/TrashList';
import { ViewToggle } from '../components/ViewToggle';
import { DropOverlay } from '../components/DropOverlay';
import { useCreateFolder } from '../hooks/useFolders';
import { useUploadFiles } from '../hooks/useUploadFiles';

const VIEW_MODE_KEY = 'securebox:viewMode';

function readViewMode() {
  const stored = typeof window !== 'undefined' ? window.localStorage.getItem(VIEW_MODE_KEY) : null;
  return stored === 'list' ? 'list' : 'grid';
}

export function Dashboard() {
  const [q, setQ] = useState('');
  const [sort, setSort] = useState('createdAt_desc');
  const [nav, setNav] = useState('files'); // 'files' | 'recent' | 'trash'
  const [folderId, setFolderId] = useState(null);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [viewMode, setViewMode] = useState(readViewMode);
  const createFolder = useCreateFolder();

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

  function handleCreateFolder(name) {
    createFolder.mutate(
      { name, parentId: effectiveFolderId },
      {
        onSuccess: () => setCreatingFolder(false),
        onError: () => toast.error('Could not create folder'),
      },
    );
  }

  const listProps = {
    q,
    sort,
    folderId: nav === 'files' ? folderId : undefined,
    view: nav === 'recent' ? 'recent' : undefined,
    emptyMessage: q
      ? 'No files match your search.'
      : nav === 'recent'
        ? 'Nothing here yet — recently used files show up here.'
        : folderId
          ? 'This folder is empty.'
          : undefined,
  };

  return (
    <Layout
      nav={nav}
      onNavChange={handleNavChange}
      q={q}
      onQChange={setQ}
      onNewFolder={() => setCreatingFolder(true)}
      onUploadFiles={uploadFiles}
    >
      <DropOverlay onDrop={uploadFiles}>
        <div className="flex flex-col gap-6">
          <UploadQueue />

          {nav === 'trash' ? (
            <TrashList />
          ) : (
            <>
              <div className="flex items-center justify-between gap-3">
                {nav === 'files' ? (
                  <Breadcrumb folderId={folderId} onNavigate={setFolderId} />
                ) : (
                  <h1 className="text-sm font-medium text-ink">Recent</h1>
                )}
                <div className="flex items-center gap-2">
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

              {nav === 'files' && !q && <FolderList parentId={folderId} onOpen={setFolderId} />}

              {viewMode === 'grid' ? <FileGrid {...listProps} /> : <FileList {...listProps} />}
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
    </Layout>
  );
}
