// Folders and files sorted together as one sequence — a folder gets no
// positional priority over a file just for being a folder; ordering is
// purely a function of the selected sort criterion.
export function sortEntries(folders, files, sort) {
  const entries = [
    ...folders.map((folder) => ({ type: 'folder', folder, name: folder.name, createdAt: folder.createdAt })),
    ...files.map((file) => ({ type: 'file', file, name: file.originalName, createdAt: file.createdAt })),
  ];

  switch (sort) {
    case 'name_desc':
      return entries.sort((a, b) => b.name.localeCompare(a.name));
    case 'createdAt_asc':
      return entries.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    case 'createdAt_desc':
      return entries.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    case 'name_asc':
    default:
      return entries.sort((a, b) => a.name.localeCompare(b.name));
  }
}
