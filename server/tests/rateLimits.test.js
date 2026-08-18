import { describe, it, expect } from 'vitest';
import { LOGIN_RATE_LIMIT, REFRESH_RATE_LIMIT } from '../src/config/rateLimits.js';

describe('rate limit config', () => {
  it('gives login/register a stricter budget than refresh', () => {
    expect(LOGIN_RATE_LIMIT.limit).toBe(10);
    expect(REFRESH_RATE_LIMIT.limit).toBe(60);
    expect(LOGIN_RATE_LIMIT.limit).toBeLessThan(REFRESH_RATE_LIMIT.limit);
  });

  it('uses a 15-minute window for both', () => {
    expect(LOGIN_RATE_LIMIT.windowMs).toBe(15 * 60 * 1000);
    expect(REFRESH_RATE_LIMIT.windowMs).toBe(15 * 60 * 1000);
  });
});
