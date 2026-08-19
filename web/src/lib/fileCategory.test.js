import { describe, it, expect } from 'vitest';
import { getFileCategory, bucketByCategory } from './fileCategory';

describe('getFileCategory', () => {
  it('buckets images, video, and audio into Media', () => {
    expect(getFileCategory('image/png')).toBe('Media');
    expect(getFileCategory('video/mp4')).toBe('Media');
    expect(getFileCategory('audio/mpeg')).toBe('Media');
  });

  it('buckets zip/tar/gzip into Archives', () => {
    expect(getFileCategory('application/zip')).toBe('Archives');
    expect(getFileCategory('application/x-tar')).toBe('Archives');
  });

  it('buckets pdf/word/sheet/text into Documents', () => {
    expect(getFileCategory('application/pdf')).toBe('Documents');
    expect(getFileCategory('text/plain')).toBe('Documents');
  });

  it('falls back to Other for unrecognized types', () => {
    expect(getFileCategory('application/octet-stream')).toBe('Other');
    expect(getFileCategory('')).toBe('Other');
  });
});

describe('bucketByCategory', () => {
  it('returns all 4 categories, even ones with no files', () => {
    const result = bucketByCategory([{ mimeType: 'image/png', count: 2, sizeBytes: '2048' }]);
    expect(result).toEqual([
      { category: 'Documents', count: 0, sizeBytes: 0 },
      { category: 'Media', count: 2, sizeBytes: 2048 },
      { category: 'Archives', count: 0, sizeBytes: 0 },
      { category: 'Other', count: 0, sizeBytes: 0 },
    ]);
  });

  it('sums multiple mimeTypes that map to the same category', () => {
    const result = bucketByCategory([
      { mimeType: 'image/png', count: 2, sizeBytes: '2048' },
      { mimeType: 'video/mp4', count: 1, sizeBytes: '4096' },
    ]);
    const media = result.find((b) => b.category === 'Media');
    expect(media).toEqual({ category: 'Media', count: 3, sizeBytes: 6144 });
  });
});
