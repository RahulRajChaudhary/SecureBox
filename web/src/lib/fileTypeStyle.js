import { Archive, File, FileCode, FileSpreadsheet, FileText, Film, Image as ImageIcon, Music } from 'lucide-react';
import { isImageMime, isVideoMime, isAudioMime, isArchiveMime } from './mimeType';

// `tint`/`chipBg` are literal Tailwind class strings (not built via template
// interpolation) so the JIT content scanner can actually find them.
const RULES = [
  { test: (m) => m === 'application/pdf', Icon: FileText, color: 'text-file-pdf', tint: 'bg-file-pdf/15', chipBg: 'bg-file-pdf' },
  { test: (m) => m.includes('sheet') || m === 'text/csv', Icon: FileSpreadsheet, color: 'text-file-sheet', tint: 'bg-file-sheet/15', chipBg: 'bg-file-sheet' },
  { test: (m) => m.includes('presentation'), Icon: FileText, color: 'text-file-slide', tint: 'bg-file-slide/15', chipBg: 'bg-file-slide' },
  { test: (m) => m.includes('word') || m.includes('document') || m === 'application/msword', Icon: FileText, color: 'text-file-doc', tint: 'bg-file-doc/15', chipBg: 'bg-file-doc' },
  { test: isImageMime, Icon: ImageIcon, color: 'text-file-image', tint: 'bg-file-image/15', chipBg: 'bg-file-image' },
  { test: isVideoMime, Icon: Film, color: 'text-file-video', tint: 'bg-file-video/15', chipBg: 'bg-file-video' },
  { test: isAudioMime, Icon: Music, color: 'text-file-audio', tint: 'bg-file-audio/15', chipBg: 'bg-file-audio' },
  { test: isArchiveMime, Icon: Archive, color: 'text-file-archive', tint: 'bg-file-archive/15', chipBg: 'bg-file-archive' },
  {
    test: (m) => m.startsWith('text/') || m === 'application/json' || m === 'application/xml',
    Icon: FileCode,
    color: 'text-file-code',
    tint: 'bg-file-code/15',
    chipBg: 'bg-file-code',
  },
];

const DEFAULT_STYLE = { Icon: File, color: 'text-muted', tint: 'bg-surface2', chipBg: 'bg-surface2' };

// Per-type colored icon + tile tint + chip background, shown wherever a file
// has no real thumbnail (non-media types, or an image/video whose preview
// failed to load) and for list-row icons.
export function getFileTypeStyle(mimeType = '') {
  const match = RULES.find((rule) => rule.test(mimeType));
  return match ?? DEFAULT_STYLE;
}

// Short badge label for the grid card's extension chip, e.g. "PDF", "DOCX".
export function getFileExtensionLabel(originalName = '') {
  const dot = originalName.lastIndexOf('.');
  if (dot < 1 || dot === originalName.length - 1) return 'FILE';
  return originalName.slice(dot + 1).toUpperCase();
}
