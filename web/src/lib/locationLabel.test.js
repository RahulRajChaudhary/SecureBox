import { describe, it, expect } from 'vitest';
import { locationLabel } from './locationLabel';

describe('locationLabel', () => {
  it('returns "My Drive" when there is no parent', () => {
    expect(locationLabel(null, [])).toBe('My Drive');
  });

  it('returns "My Drive" when crumbs are empty even with a parentId', () => {
    expect(locationLabel('some-id', [])).toBe('My Drive');
  });

  it('joins crumb names with " / "', () => {
    const crumbs = [
      { id: 'id-1', name: 'Photos' },
      { id: 'id-2', name: '2026' },
    ];
    expect(locationLabel('id-2', crumbs)).toBe('Photos / 2026');
  });
});
