import { describe, it, expect, vi, beforeEach } from 'vitest';

const { verifyIdToken } = vi.hoisted(() => ({ verifyIdToken: vi.fn() }));

vi.mock('google-auth-library', () => ({
  OAuth2Client: vi.fn().mockImplementation(function () {
    return { verifyIdToken };
  }),
}));

const { verifyGoogleIdToken } = await import('../src/lib/google.js');

describe('verifyGoogleIdToken', () => {
  beforeEach(() => {
    verifyIdToken.mockReset();
  });

  it('returns the mapped payload for a valid token', async () => {
    verifyIdToken.mockResolvedValue({
      getPayload: () => ({ sub: 'google-123', email: 'alice@example.com', email_verified: true }),
    });

    const result = await verifyGoogleIdToken('valid-credential');

    expect(result).toEqual({ googleId: 'google-123', email: 'alice@example.com', emailVerified: true });
  });

  it('reports emailVerified: false when Google has not verified the email', async () => {
    verifyIdToken.mockResolvedValue({
      getPayload: () => ({ sub: 'google-123', email: 'alice@example.com', email_verified: false }),
    });

    const result = await verifyGoogleIdToken('valid-credential');

    expect(result.emailVerified).toBe(false);
  });

  it('throws UnauthorizedError when the token is invalid', async () => {
    verifyIdToken.mockRejectedValue(new Error('Token used too late'));

    await expect(verifyGoogleIdToken('bad-credential')).rejects.toThrow('Invalid Google credential');
  });
});
