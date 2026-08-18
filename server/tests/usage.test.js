import crypto from 'node:crypto';
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';

const REAL_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64',
);

function pngBuffer(size) {
  return Buffer.concat([REAL_PNG, crypto.randomBytes(Math.max(size - REAL_PNG.length, 0))]);
}

async function registerUser() {
  const email = `${crypto.randomUUID()}@example.com`;
  const res = await request(app).post('/api/auth/register').send({ email, password: 'correct-horse-battery' });
  return res.body.accessToken;
}

async function createReadyFile(token, sizeBytes = 1024) {
  const intent = await request(app)
    .post('/api/files/upload-intent')
    .set('Authorization', `Bearer ${token}`)
    .send({ filename: 'photo.png', sizeBytes, mimeType: 'image/png' });
  const { fileId, partSize, partUrls } = intent.body.data;
  const buf = pngBuffer(sizeBytes);
  for (const { partNumber, url } of partUrls) {
    const start = (partNumber - 1) * partSize;
    const chunk = buf.subarray(start, start + partSize);
    const res = await fetch(url, { method: 'PUT', body: chunk });
    if (!res.ok) throw new Error(`part ${partNumber} upload failed: ${res.status}`);
  }
  const res = await request(app).post(`/api/files/${fileId}/complete`).set('Authorization', `Bearer ${token}`);
  return { fileId, res };
}

describe('GET /api/files/usage', () => {
  it("sums sizeBytes across the user's READY files", async () => {
    const token = await registerUser();
    await createReadyFile(token, 1024);
    await createReadyFile(token, 2048);

    const res = await request(app).get('/api/files/usage').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.usedBytes).toBe('3072');
  }, 20000);

  it('excludes trashed files from the total', async () => {
    const token = await registerUser();
    const { fileId } = await createReadyFile(token, 1024);
    await createReadyFile(token, 2048);
    await request(app).delete(`/api/files/${fileId}`).set('Authorization', `Bearer ${token}`);

    const res = await request(app).get('/api/files/usage').set('Authorization', `Bearer ${token}`);

    expect(res.body.data.usedBytes).toBe('2048');
  }, 20000);

  it('excludes files that never finished uploading (PENDING)', async () => {
    const token = await registerUser();
    await request(app)
      .post('/api/files/upload-intent')
      .set('Authorization', `Bearer ${token}`)
      .send({ filename: 'photo.png', sizeBytes: 1024, mimeType: 'image/png' });

    const res = await request(app).get('/api/files/usage').set('Authorization', `Bearer ${token}`);

    expect(res.body.data.usedBytes).toBe('0');
  });

  it('returns 0 for a user with no files', async () => {
    const token = await registerUser();
    const res = await request(app).get('/api/files/usage').set('Authorization', `Bearer ${token}`);
    expect(res.body.data.usedBytes).toBe('0');
  });

  it('rejects an unauthenticated request with 401', async () => {
    const res = await request(app).get('/api/files/usage');
    expect(res.status).toBe(401);
  });
});
