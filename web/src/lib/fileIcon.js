import { Archive, File, FileText, Film, Image as ImageIcon, Music } from 'lucide-react';

// Icon varies by file type so the list is scannable at a glance —
// color stays uniform (muted/ink) to keep the single-accent palette intact.
export function getFileIcon(mimeType = '') {
  if (mimeType.startsWith('image/')) return ImageIcon;
  if (mimeType.startsWith('video/')) return Film;
  if (mimeType.startsWith('audio/')) return Music;
  if (mimeType.includes('zip') || mimeType.includes('tar') || mimeType.includes('gzip')) return Archive;
  if (
    mimeType === 'application/pdf' ||
    mimeType.startsWith('text/') ||
    mimeType.includes('word') ||
    mimeType.includes('document') ||
    mimeType.includes('sheet') ||
    mimeType.includes('presentation') ||
    mimeType === 'application/json' ||
    mimeType === 'application/xml'
  )
    return FileText;
  return File;
}
