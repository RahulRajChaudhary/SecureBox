import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import { requireAuth } from '../src/middleware/requireAuth.js';
import { signAccessToken } from '../src/lib/tokens.js';
import { UnauthorizedError } from '../src/lib/errors.js';

const { verifyGoogleIdToken } = vi.hoisted(() => ({ verifyGoogleIdToken: vi.fn() }));

vi.mock('../src/lib/google.js', () => ({ verifyGoogleIdToken }));

beforeEach(() => {
  verifyGoogleIdToken.mockReset();
});

const credentials = { email: 'alice@example.com', password: 'correct-horse-battery' };

describe('POST /api/auth/register', () => {
  it('creates a user, returns an access token, and sets the refresh cookie', async () => {
    const res = await request(app).post('/api/auth/register').send(credentials);

    expect(res.status).toBe(201);
    expect(res.body.accessToken).toEqual(expect.any(String));
    expect(res.body.user).toEqual({ id: expect.any(String), email: credentials.email });
    expect(res.headers['set-cookie'][0]).toMatch(/^refresh_token=/);
  });

  it('rejects a duplicate email with 409', async () => {
    await request(app).post('/api/auth/register').send(credentials);
    const res = await request(app).post('/api/auth/register').send(credentials);

    expect(res.status).toBe(409);
  });

  it('rejects invalid input with 400', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'not-an-email', password: 'short' });

    expect(res.status).toBe(400);
  });

  it('stores the password as an argon2 hash, not plaintext', async () => {
    await request(app).post('/api/auth/register').send(credentials);
    const stored = await prisma.user.findUniqueOrThrow({ where: { email: credentials.email } });

    expect(stored.passwordHash).not.toBe(credentials.password);
    expect(stored.passwordHash).toMatch(/^\$argon2/);
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await request(app).post('/api/auth/register').send(credentials);
  });

  it('logs in with correct credentials', async () => {
    const res = await request(app).post('/api/auth/login').send(credentials);

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toEqual(expect.any(String));
  });

  it('rejects a wrong password with 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ ...credentials, password: 'wrong-password' });

    expect(res.status).toBe(401);
  });

  it('rejects an unknown email with the same 401 shape as a wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'whatever1' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid email or password');
  });

  it('rejects login for a Google-only account with no password set', async () => {
    verifyGoogleIdToken.mockResolvedValue({
      googleId: 'google-9',
      email: 'erin@example.com',
      emailVerified: true,
    });
    await request(app).post('/api/auth/google').send({ credential: 'valid-token' });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'erin@example.com', password: 'whatever1' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid email or password');
  });
});

describe('POST /api/auth/refresh', () => {
  it('rejects a request with no refresh cookie', async () => {
    const res = await request(app).post('/api/auth/refresh');

    expect(res.status).toBe(401);
  });

  it('rotates the refresh cookie and returns a new access token', async () => {
    const agent = request.agent(app);
    await agent.post('/api/auth/register').send(credentials);

    const res = await agent.post('/api/auth/refresh');

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toEqual(expect.any(String));
    expect(res.headers['set-cookie'][0]).toMatch(/^refresh_token=/);
  });

  it('accepts reuse of a just-rotated refresh token within the grace window', async () => {
    const agent = request.agent(app);
    const regRes = await agent.post('/api/auth/register').send(credentials);
    const originalCookie = regRes.headers['set-cookie'];

    await agent.post('/api/auth/refresh'); // rotates; agent jar now holds the new cookie

    const reuseRes = await request(app).post('/api/auth/refresh').set('Cookie', originalCookie);

    expect(reuseRes.status).toBe(200);
    expect(reuseRes.body.accessToken).toEqual(expect.any(String));
  });

  it('rejects reuse of a rotated refresh token outside the grace window', async () => {
    const agent = request.agent(app);
    const regRes = await agent.post('/api/auth/register').send(credentials);
    const originalCookie = regRes.headers['set-cookie'];

    await agent.post('/api/auth/refresh'); // rotates
    await prisma.session.updateMany({
      where: { revokedAt: { not: null } },
      data: { revokedAt: new Date(Date.now() - 20_000) },
    });

    const reuseRes = await request(app).post('/api/auth/refresh').set('Cookie', originalCookie);

    expect(reuseRes.status).toBe(401);
  });

  it('lets two concurrent refreshes on the same pre-rotation token both succeed, leaving exactly one active session', async () => {
    const agent = request.agent(app);
    const regRes = await agent.post('/api/auth/register').send(credentials);
    const originalCookie = regRes.headers['set-cookie'];
    const { user } = regRes.body;

    await agent.post('/api/auth/refresh'); // "winner" — rotates
    const loserRes = await request(app).post('/api/auth/refresh').set('Cookie', originalCookie); // "loser" — same old cookie

    expect(loserRes.status).toBe(200);

    const activeSessions = await prisma.session.count({ where: { userId: user.id, revokedAt: null } });
    expect(activeSessions).toBe(1);
  });

  it('revokes the whole session family when a rotated token is reused outside the grace window', async () => {
    const agent = request.agent(app);
    const regRes = await agent.post('/api/auth/register').send(credentials);
    const originalCookie = regRes.headers['set-cookie'];

    await agent.post('/api/auth/refresh'); // legitimate rotation -> cookie A
    await prisma.session.updateMany({
      where: { revokedAt: { not: null } },
      data: { revokedAt: new Date(Date.now() - 20_000) },
    });
    await request(app).post('/api/auth/refresh').set('Cookie', originalCookie); // reuse outside grace -> revokes family

    const res = await agent.post('/api/auth/refresh'); // cookie A should be dead too

    expect(res.status).toBe(401);
  });

  it('rejects an expired session', async () => {
    const agent = request.agent(app);
    await agent.post('/api/auth/register').send(credentials);
    await prisma.session.updateMany({ data: { expiresAt: new Date(Date.now() - 1000) } });

    const res = await agent.post('/api/auth/refresh');

    expect(res.status).toBe(401);
  });
});

describe('POST /api/auth/logout', () => {
  it('clears the refresh cookie and returns 204', async () => {
    const agent = request.agent(app);
    await agent.post('/api/auth/register').send(credentials);

    const res = await agent.post('/api/auth/logout');

    expect(res.status).toBe(204);
  });

  it('invalidates the refresh token so a subsequent refresh fails', async () => {
    const agent = request.agent(app);
    await agent.post('/api/auth/register').send(credentials);
    await agent.post('/api/auth/logout');

    const res = await agent.post('/api/auth/refresh');

    expect(res.status).toBe(401);
  });
});

describe('POST /api/auth/logout-all', () => {
  it('requires authentication', async () => {
    const res = await request(app).post('/api/auth/logout-all');

    expect(res.status).toBe(401);
  });

  it('revokes every session for the user, across families', async () => {
    const agent = request.agent(app);
    const regRes = await agent.post('/api/auth/register').send(credentials);
    const { accessToken, user } = regRes.body;

    // A second "device": logging in again creates a second session family.
    await request(app).post('/api/auth/login').send(credentials);

    const res = await request(app)
      .post('/api/auth/logout-all')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(204);

    const activeSessions = await prisma.session.count({
      where: { userId: user.id, revokedAt: null },
    });
    expect(activeSessions).toBe(0);
  });

  it("does not revoke another user's sessions", async () => {
    const regA = await request(app).post('/api/auth/register').send(credentials);

    const otherCredentials = { email: 'bob@example.com', password: 'correct-horse-battery' };
    const agentB = request.agent(app);
    await agentB.post('/api/auth/register').send(otherCredentials);

    await request(app)
      .post('/api/auth/logout-all')
      .set('Authorization', `Bearer ${regA.body.accessToken}`);

    const refreshB = await agentB.post('/api/auth/refresh');
    expect(refreshB.status).toBe(200);
  });
});

describe('POST /api/auth/google', () => {
  it('creates a new user on first Google sign-in', async () => {
    verifyGoogleIdToken.mockResolvedValue({
      googleId: 'google-1',
      email: 'carol@example.com',
      emailVerified: true,
    });

    const res = await request(app).post('/api/auth/google').send({ credential: 'valid-token' });

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toEqual(expect.any(String));
    expect(res.body.user).toEqual({ id: expect.any(String), email: 'carol@example.com' });
    expect(res.headers['set-cookie'][0]).toMatch(/^refresh_token=/);

    const stored = await prisma.user.findUniqueOrThrow({ where: { email: 'carol@example.com' } });
    expect(stored.googleId).toBe('google-1');
    expect(stored.passwordHash).toBeNull();
  });

  it('logs in a returning Google user without creating a duplicate', async () => {
    verifyGoogleIdToken.mockResolvedValue({
      googleId: 'google-1',
      email: 'carol@example.com',
      emailVerified: true,
    });

    await request(app).post('/api/auth/google').send({ credential: 'valid-token' });
    const res = await request(app).post('/api/auth/google').send({ credential: 'valid-token' });

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('carol@example.com');

    const count = await prisma.user.count({ where: { email: 'carol@example.com' } });
    expect(count).toBe(1);
  });

  it('auto-links Google to an existing password account with the same email', async () => {
    await request(app).post('/api/auth/register').send(credentials);
    verifyGoogleIdToken.mockResolvedValue({
      googleId: 'google-2',
      email: credentials.email,
      emailVerified: true,
    });

    const res = await request(app).post('/api/auth/google').send({ credential: 'valid-token' });

    expect(res.status).toBe(200);
    const stored = await prisma.user.findUniqueOrThrow({ where: { email: credentials.email } });
    expect(stored.googleId).toBe('google-2');
    expect(stored.passwordHash).toMatch(/^\$argon2/);
  });

  it('rejects an unverified Google email with 401', async () => {
    verifyGoogleIdToken.mockResolvedValue({
      googleId: 'google-3',
      email: 'dave@example.com',
      emailVerified: false,
    });

    const res = await request(app).post('/api/auth/google').send({ credential: 'valid-token' });

    expect(res.status).toBe(401);
  });

  it('rejects an invalid Google credential with 401', async () => {
    verifyGoogleIdToken.mockRejectedValue(new UnauthorizedError('Invalid Google credential'));

    const res = await request(app).post('/api/auth/google').send({ credential: 'garbage' });

    expect(res.status).toBe(401);
  });
});

describe('requireAuth middleware', () => {
  it('rejects a request with no Authorization header', () => {
    const req = { headers: {} };
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    const next = vi.fn();

    requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects an invalid bearer token', () => {
    const req = { headers: { authorization: 'Bearer not-a-real-token' } };
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    const next = vi.fn();

    requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('accepts a valid access token and attaches req.userId', () => {
    const token = signAccessToken({ id: 'user-123', email: 'a@b.com' });
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = {};
    const next = vi.fn();

    requireAuth(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.userId).toBe('user-123');
  });
});
