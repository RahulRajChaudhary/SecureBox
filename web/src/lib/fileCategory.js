import { isImageMime, isVideoMime, isAudioMime, isArchiveMime, isDocumentMime } from './mimeType';

export const FILE_CATEGORIES = ['Documents', 'Media', 'Archives', 'Other'];

export function getFileCategory(mimeType = '') {
  if (isImageMime(mimeType) || isVideoMime(mimeType) || isAudioMime(mimeType)) return 'Media';
  if (isArchiveMime(mimeType)) return 'Archives';
  if (isDocumentMime(mimeType)) return 'Documents';
  return 'Other';
}

// Reduces the raw byMimeType[] from GET /api/files/stats into the 4 chart
// categories: [{ category, count, sizeBytes }]. Zero-value categories are
// still included so the legend always shows all 4.
export function bucketByCategory(byMimeType = []) {
  const totals = Object.fromEntries(FILE_CATEGORIES.map((c) => [c, { count: 0, sizeBytes: 0 }]));
  for (const { mimeType, count, sizeBytes } of byMimeType) {
    const bucket = totals[getFileCategory(mimeType)];
    bucket.count += count;
    bucket.sizeBytes += Number(sizeBytes);
  }
  return FILE_CATEGORIES.map((category) => ({ category, ...totals[category] }));
}
