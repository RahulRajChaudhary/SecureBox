import crypto from 'node:crypto';
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';

const REAL_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64',
);

async function registerUser() {
  const email = `${crypto.randomUUID()}@example.com`;
  const res = await request(app).post('/api/auth/register').send({ email, password: 'correct-horse-battery' });
  return res.body.accessToken;
}

describe('GET /api/auth/me', () => {
  it('returns the user with a null avatarUrl before any avatar is set', async () => {
    const token = await registerUser();
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.avatarUrl).toBeNull();
  });

  it('rejects an unauthenticated request with 401', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});

describe('Avatar upload', () => {
  it('signs an upload URL, accepts the PUT, and confirm sets a resolvable avatarUrl', async () => {
    const token = await registerUser();

    const signRes = await request(app)
      .put('/api/auth/me/avatar')
      .set('Authorization', `Bearer ${token}`)
      .send({ mimeType: 'image/png' });
    expect(signRes.status).toBe(200);
    const { uploadUrl } = signRes.body.data;

    const putRes = await fetch(uploadUrl, {
      method: 'PUT',
      body: REAL_PNG,
      headers: { 'Content-Type': 'image/png' },
    });
    expect(putRes.ok).toBe(true);

    const confirmRes = await request(app)
      .post('/api/auth/me/avatar/confirm')
      .set('Authorization', `Bearer ${token}`);
    expect(confirmRes.status).toBe(200);
    expect(confirmRes.body.data.avatarUrl).toEqual(expect.any(String));

    const meRes = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(meRes.body.data.avatarUrl).toEqual(expect.any(String));
  });

  it('rejects a disallowed MIME type with 415', async () => {
    const token = await registerUser();
    const res = await request(app)
      .put('/api/auth/me/avatar')
      .set('Authorization', `Bearer ${token}`)
      .send({ mimeType: 'application/pdf' });
    expect(res.status).toBe(415);
  });

  it('rejects confirm with 409 AVATAR_NOT_UPLOADED when nothing was uploaded', async () => {
    const token = await registerUser();
    const res = await request(app)
      .post('/api/auth/me/avatar/confirm')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('AVATAR_NOT_UPLOADED');
  });

  it('rejects unauthenticated sign and confirm requests with 401', async () => {
    const signRes = await request(app).put('/api/auth/me/avatar').send({ mimeType: 'image/png' });
    expect(signRes.status).toBe(401);

    const confirmRes = await request(app).post('/api/auth/me/avatar/confirm');
    expect(confirmRes.status).toBe(401);
  });
});
