import { Archive, File, FileText, Film, Image as ImageIcon, Music } from 'lucide-react';
import { isImageMime, isVideoMime, isAudioMime, isArchiveMime, isDocumentMime } from './mimeType';

// Icon varies by file type so the list is scannable at a glance —
// color stays uniform (muted/ink) to keep the single-accent palette intact.
export function getFileIcon(mimeType = '') {
  if (isImageMime(mimeType)) return ImageIcon;
  if (isVideoMime(mimeType)) return Film;
  if (isAudioMime(mimeType)) return Music;
  if (isArchiveMime(mimeType)) return Archive;
  if (isDocumentMime(mimeType)) return FileText;
  return File;
}
