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

async function createFolder(token, name) {
  const res = await request(app).post('/api/folders').set('Authorization', `Bearer ${token}`).send({ name });
  return res.body.data.id;
}

async function createReadyFileInFolder(token, filename, folderId) {
  const intent = await request(app)
    .post('/api/files/upload-intent')
    .set('Authorization', `Bearer ${token}`)
    .send({ filename, sizeBytes: REAL_PNG.length, mimeType: 'image/png', folderId });
  const { fileId, partUrls } = intent.body.data;
  await fetch(partUrls[0].url, { method: 'PUT', body: REAL_PNG });
  await request(app).post(`/api/files/${fileId}/complete`).set('Authorization', `Bearer ${token}`);
  return fileId;
}

describe('GET /api/files?view=recent', () => {
  it('ignores folder scope, returning files from every folder', async () => {
    const token = await registerUser();
    const folder = await createFolder(token, 'Photos');
    await createReadyFileInFolder(token, 'root.png');
    await createReadyFileInFolder(token, 'nested.png', folder);

    const res = await request(app).get('/api/files?view=recent').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.map((f) => f.originalName).sort()).toEqual(['nested.png', 'root.png']);
  }, 20000);

  it('sorts by most recently updated first, regardless of the sort param', async () => {
    const token = await registerUser();
    const firstId = await createReadyFileInFolder(token, 'first.png');
    await createReadyFileInFolder(token, 'second.png');
    await request(app)
      .patch(`/api/files/${firstId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'first-renamed.png' });

    const res = await request(app)
      .get('/api/files?view=recent&sort=createdAt_asc')
      .set('Authorization', `Bearer ${token}`);

    expect(res.body.data.map((f) => f.originalName)).toEqual(['first-renamed.png', 'second.png']);
  }, 20000);

  it('plain listing (no view) still scopes to the given folder', async () => {
    const token = await registerUser();
    const folder = await createFolder(token, 'Photos');
    await createReadyFileInFolder(token, 'root.png');
    await createReadyFileInFolder(token, 'nested.png', folder);

    const res = await request(app).get('/api/files').set('Authorization', `Bearer ${token}`);

    expect(res.body.data.map((f) => f.originalName)).toEqual(['root.png']);
  }, 20000);
});
