import { describe, it, expect, vi, beforeEach } from 'vitest';
import { refreshAccessToken, getAccessToken } from './api';

describe('refreshAccessToken', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('coalesces concurrent calls into a single request', async () => {
    let resolveFetch;
    const fetchPromise = new Promise((resolve) => {
      resolveFetch = resolve;
    });
    const fetchMock = vi.fn().mockReturnValue(fetchPromise);
    global.fetch = fetchMock;

    const call1 = refreshAccessToken();
    const call2 = refreshAccessToken();

    resolveFetch({
      ok: true,
      json: async () => ({ accessToken: 'new-token' }),
    });

    const [token1, token2] = await Promise.all([call1, call2]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(token1).toBe('new-token');
    expect(token2).toBe('new-token');
    expect(getAccessToken()).toBe('new-token');
  });

  it('starts a fresh request after the previous one settles', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ accessToken: 'token-a' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ accessToken: 'token-b' }) });
    global.fetch = fetchMock;

    const first = await refreshAccessToken();
    const second = await refreshAccessToken();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(first).toBe('token-a');
    expect(second).toBe('token-b');
  });
});
