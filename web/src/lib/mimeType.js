export function isImageMime(mimeType = '') {
  return mimeType.startsWith('image/');
}

export function isVideoMime(mimeType = '') {
  return mimeType.startsWith('video/');
}

export function isAudioMime(mimeType = '') {
  return mimeType.startsWith('audio/');
}

export function isArchiveMime(mimeType = '') {
  return mimeType.includes('zip') || mimeType.includes('tar') || mimeType.includes('gzip');
}

export function isDocumentMime(mimeType = '') {
  return (
    mimeType === 'application/pdf' ||
    mimeType.startsWith('text/') ||
    mimeType.includes('word') ||
    mimeType.includes('document') ||
    mimeType.includes('sheet') ||
    mimeType.includes('presentation') ||
    mimeType === 'application/json' ||
    mimeType === 'application/xml'
  );
}
