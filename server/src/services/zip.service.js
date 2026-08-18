import { getRangedBytes } from './upload.service.js';
import { ConflictError } from '../lib/errors.js';

const EOCD_SIGNATURE = 0x06054b50;
const CENTRAL_HEADER_SIGNATURE = 0x02014b50;
const EOCD_MIN_SIZE = 22;
const EOCD_MAX_COMMENT = 65535;
const MAX_ENTRIES = 5000; // safety cap against zip bombs with millions of tiny entries

// A zip's file list lives in a "central directory" at the END of the
// archive, not scattered through it — so listing contents only ever needs
// two small ranged reads (find the EOCD tail, then read the central
// directory it points at), never the file data itself, regardless of
// whether the archive is 1MB or 5GB.
export async function getZipListing({ storageKey, sizeBytes }) {
  const size = Number(sizeBytes);
  const tailSize = Math.min(size, EOCD_MIN_SIZE + EOCD_MAX_COMMENT);
  const tail = await getRangedBytes({ storageKey, start: size - tailSize, end: size - 1 });

  const eocdOffsetInTail = findEocd(tail);
  if (eocdOffsetInTail === -1) {
    throw new ConflictError('Could not locate zip central directory', 'ZIP_PARSE_FAILED');
  }

  const centralDirSize = tail.readUInt32LE(eocdOffsetInTail + 12);
  const centralDirOffset = tail.readUInt32LE(eocdOffsetInTail + 16);
  const numEntries = tail.readUInt16LE(eocdOffsetInTail + 10);

  if (centralDirOffset === 0xffffffff || numEntries === 0xffff) {
    throw new ConflictError('ZIP64 archives are not supported for preview', 'ZIP64_UNSUPPORTED');
  }

  const centralDir = await getRangedBytes({
    storageKey,
    start: centralDirOffset,
    end: centralDirOffset + centralDirSize - 1,
  });

  const entries = parseCentralDirectory(centralDir, numEntries);
  return buildTree(entries.list, entries.truncated);
}

function findEocd(buf) {
  for (let i = buf.length - EOCD_MIN_SIZE; i >= 0; i--) {
    if (buf.readUInt32LE(i) === EOCD_SIGNATURE) return i;
  }
  return -1;
}

function parseCentralDirectory(buf, numEntries) {
  const list = [];
  let offset = 0;
  let truncated = false;

  for (let i = 0; i < numEntries && offset < buf.length; i++) {
    if (buf.readUInt32LE(offset) !== CENTRAL_HEADER_SIGNATURE) break;
    if (list.length >= MAX_ENTRIES) {
      truncated = true;
      break;
    }

    const compressedSize = buf.readUInt32LE(offset + 20);
    const uncompressedSize = buf.readUInt32LE(offset + 24);
    const filenameLength = buf.readUInt16LE(offset + 28);
    const extraLength = buf.readUInt16LE(offset + 30);
    const commentLength = buf.readUInt16LE(offset + 32);

    const nameStart = offset + 46;
    const name = buf.toString('utf8', nameStart, nameStart + filenameLength);

    list.push({ name, size: uncompressedSize || compressedSize });
    offset = nameStart + filenameLength + extraLength + commentLength;
  }

  return { list, truncated };
}

// Builds a nested folder/file tree from flat zip entry paths, e.g.
// "photos/2024/a.jpg" becomes { photos: { 2024: { a.jpg } } }. Entries
// ending in "/" are explicit directory markers — they create the folder
// node but no file leaf.
function buildTree(entries, truncated) {
  const root = new Map();

  for (const entry of entries) {
    const isDir = entry.name.endsWith('/');
    const parts = entry.name.split('/').filter(Boolean);
    let level = root;

    parts.forEach((part, i) => {
      const isLast = i === parts.length - 1;
      if (isLast && !isDir) {
        level.set(part, { name: part, type: 'file', sizeBytes: entry.size });
        return;
      }
      if (!level.has(part) || level.get(part).type !== 'folder') {
        level.set(part, { name: part, type: 'folder', children: new Map() });
      }
      level = level.get(part).children;
    });
  }

  return { truncated, entries: toPlain(root) };
}

function toPlain(map) {
  return [...map.values()]
    .map((node) =>
      node.type === 'folder'
        ? { name: node.name, type: 'folder', children: toPlain(node.children) }
        : node,
    )
    .sort((a, b) => (a.type === b.type ? a.name.localeCompare(b.name) : a.type === 'folder' ? -1 : 1));
}
