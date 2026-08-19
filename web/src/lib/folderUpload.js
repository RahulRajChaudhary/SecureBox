// A file from the "Upload folder" <input webkitdirectory> picker carries
// webkitRelativePath (e.g. "Photos/2024/img1.jpg") — the browser's only
// way of exposing picked folder structure. Regular multi-file picks and
// drag-drop leave it as an empty string, so hasFolderPath tells the two
// apart.
export function hasFolderPath(file) {
  return Boolean(file.webkitRelativePath);
}

// Directory portion of a relativePath, e.g. "Photos/2024/img1.jpg" -> "Photos/2024".
// A file directly inside the picked folder ("Photos/img1.jpg") -> "Photos".
// A bare filename with no directory -> "".
export function dirPath(relativePath) {
  const parts = relativePath.split('/');
  return parts.slice(0, -1).join('/');
}

// Every unique directory path needed to place all given files, shallowest
// (closest to the picked root) first, so parents are always created
// before their children.
export function uniqueDirPaths(files) {
  const dirs = new Set();
  for (const file of files) {
    let path = dirPath(file.webkitRelativePath);
    while (path) {
      dirs.add(path);
      path = dirPath(path);
    }
  }
  return Array.from(dirs).sort((a, b) => a.split('/').length - b.split('/').length);
}
