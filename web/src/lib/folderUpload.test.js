import { describe, it, expect } from 'vitest';
import { hasFolderPath, dirPath, uniqueDirPaths } from './folderUpload';

describe('hasFolderPath', () => {
  it('is true when webkitRelativePath is a non-empty string', () => {
    expect(hasFolderPath({ webkitRelativePath: 'Photos/img1.jpg' })).toBe(true);
  });

  it('is false when webkitRelativePath is empty or missing', () => {
    expect(hasFolderPath({ webkitRelativePath: '' })).toBe(false);
    expect(hasFolderPath({})).toBe(false);
  });
});

describe('dirPath', () => {
  it('returns the parent directory of a nested path', () => {
    expect(dirPath('Photos/2024/img1.jpg')).toBe('Photos/2024');
  });

  it('returns the top-level folder name for a direct child', () => {
    expect(dirPath('Photos/img1.jpg')).toBe('Photos');
  });

  it('returns an empty string for a bare filename', () => {
    expect(dirPath('img1.jpg')).toBe('');
  });
});

describe('uniqueDirPaths', () => {
  it('collects every ancestor directory, shallowest first', () => {
    const files = [
      { webkitRelativePath: 'Photos/2024/img1.jpg' },
      { webkitRelativePath: 'Photos/2024/img2.jpg' },
      { webkitRelativePath: 'Photos/notes.txt' },
    ];
    expect(uniqueDirPaths(files)).toEqual(['Photos', 'Photos/2024']);
  });

  it('dedupes shared ancestors across many nested files', () => {
    const files = [
      { webkitRelativePath: 'A/B/C/one.txt' },
      { webkitRelativePath: 'A/B/two.txt' },
      { webkitRelativePath: 'A/three.txt' },
    ];
    expect(uniqueDirPaths(files)).toEqual(['A', 'A/B', 'A/B/C']);
  });
});
