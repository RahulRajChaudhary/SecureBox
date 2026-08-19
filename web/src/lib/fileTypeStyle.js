import { Archive, File, FileCode, FileSpreadsheet, FileText, Film, Image as ImageIcon, Music } from 'lucide-react';
import { isImageMime, isVideoMime, isAudioMime, isArchiveMime } from './mimeType';

const RULES = [
  { test: (m) => m === 'application/pdf', Icon: FileText, color: 'text-file-pdf' },
  { test: (m) => m.includes('sheet') || m === 'text/csv', Icon: FileSpreadsheet, color: 'text-file-sheet' },
  { test: (m) => m.includes('presentation'), Icon: FileText, color: 'text-file-slide' },
  { test: (m) => m.includes('word') || m.includes('document') || m === 'application/msword', Icon: FileText, color: 'text-file-doc' },
  { test: isImageMime, Icon: ImageIcon, color: 'text-file-image' },
  { test: isVideoMime, Icon: Film, color: 'text-file-video' },
  { test: isAudioMime, Icon: Music, color: 'text-file-audio' },
  { test: isArchiveMime, Icon: Archive, color: 'text-file-archive' },
  {
    test: (m) => m.startsWith('text/') || m === 'application/json' || m === 'application/xml',
    Icon: FileCode,
    color: 'text-file-code',
  },
];

// Big, per-type colored icon shown wherever a file has no real thumbnail
// (non-media types, or an image/video whose preview failed to load).
export function getFileTypeStyle(mimeType = '') {
  const match = RULES.find((rule) => rule.test(mimeType));
  return match ?? { Icon: File, color: 'text-muted' };
}
