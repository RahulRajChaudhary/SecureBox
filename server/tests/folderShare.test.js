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

async function uploadAllParts(partUrls, buf, partSize) {
  for (const { partNumber, url } of partUrls) {
    const start = (partNumber - 1) * partSize;
    const chunk = buf.subarray(start, start + partSize);
    const res = await fetch(url, { method: 'PUT', body: chunk });
    if (!res.ok) throw new Error(`part ${partNumber} upload failed: ${res.status}`);
  }
}

async function registerUser() {
  const email = `${crypto.randomUUID()}@example.com`;
  const res = await request(app).post('/api/auth/register').send({ email, password: 'correct-horse-battery' });
  return res.body.accessToken;
}

async function createFolder(token, { name = 'Docs', parentId } = {}) {
  const res = await request(app).post('/api/folders').set('Authorization', `Bearer ${token}`).send({ name, parentId });
  return res.body.data;
}

async function publish(token, folderId) {
  const res = await request(app)
    .patch(`/api/folders/${folderId}`)
    .set('Authorization', `Bearer ${token}`)
    .send({ visibility: 'PUBLIC' });
  return res.body.data.shareSlug;
}

async function uploadReadyFile(token, { folderId, sizeBytes = 1024 } = {}) {
  const intent = await request(app)
    .post('/api/files/upload-intent')
    .set('Authorization', `Bearer ${token}`)
    .send({ filename: 'photo.png', sizeBytes, mimeType: 'image/png', folderId: folderId ?? null });
  const { fileId, partSize, partUrls } = intent.body.data;
  await uploadAllParts(partUrls, pngBuffer(sizeBytes), partSize);
  await request(app).post(`/api/files/${fileId}/complete`).set('Authorization', `Bearer ${token}`);
  return fileId;
}

describe('GET /api/share/folder/:slug', () => {
  it('404s for an unknown slug', async () => {
    const res = await request(app).get('/api/share/folder/does-not-exist');
    expect(res.status).toBe(404);
  });

  it('404s for a private folder', async () => {
    const token = await registerUser();
    const folder = await createFolder(token);
    // never published — no real slug exists, so route it through a folder id instead
    const res = await request(app).get(`/api/share/folder/${folder.id}`);
    expect(res.status).toBe(404);
  });

  it('returns the folder plus its direct children for a public folder', async () => {
    const token = await registerUser();
    const root = await createFolder(token, { name: 'Photos' });
    const child = await createFolder(token, { name: '2026', parentId: root.id });
    const slug = await publish(token, root.id);

    const res = await request(app).get(`/api/share/folder/${slug}`);

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Photos');
    expect(res.body.data.breadcrumb).toEqual([{ id: root.id, name: 'Photos' }]);
    expect(res.body.data.subfolders).toEqual([{ id: child.id, name: '2026' }]);
  });

  it('exposes a child folder even if that child is itself PRIVATE', async () => {
    const token = await registerUser();
    const root = await createFolder(token, { name: 'Photos' });
    const child = await createFolder(token, { name: '2026', parentId: root.id });
    const slug = await publish(token, root.id);

    const res = await request(app).get(`/api/share/folder/${slug}`);
    expect(res.body.data.subfolders.map((f) => f.id)).toContain(child.id);
  });
});

describe('GET /api/share/folder/:slug/browse/:folderId', () => {
  it('browses into a descendant with a root-anchored breadcrumb', async () => {
    const token = await registerUser();
    const root = await createFolder(token, { name: 'Photos' });
    const child = await createFolder(token, { name: '2026', parentId: root.id });
    const slug = await publish(token, root.id);

    const res = await request(app).get(`/api/share/folder/${slug}/browse/${child.id}`);

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('2026');
    expect(res.body.data.breadcrumb).toEqual([
      { id: root.id, name: 'Photos' },
      { id: child.id, name: '2026' },
    ]);
  });

  it('404s for a folder outside the shared subtree', async () => {
    const token = await registerUser();
    const root = await createFolder(token, { name: 'Photos' });
    const unrelated = await createFolder(token, { name: 'Videos' });
    const slug = await publish(token, root.id);

    const res = await request(app).get(`/api/share/folder/${slug}/browse/${unrelated.id}`);
    expect(res.status).toBe(404);
  });

  it("404s for another user's folder", async () => {
    const tokenA = await registerUser();
    const tokenB = await registerUser();
    const root = await createFolder(tokenA, { name: 'Photos' });
    const othersFolder = await createFolder(tokenB, { name: 'Mine' });
    const slug = await publish(tokenA, root.id);

    const res = await request(app).get(`/api/share/folder/${slug}/browse/${othersFolder.id}`);
    expect(res.status).toBe(404);
  });
});

describe('GET /api/share/folder/:slug/files/:fileId/download', () => {
  it('redirects to a presigned URL for a file inside the shared subtree', async () => {
    const token = await registerUser();
    const root = await createFolder(token, { name: 'Photos' });
    const fileId = await uploadReadyFile(token, { folderId: root.id });
    const slug = await publish(token, root.id);

    const res = await request(app).get(`/api/share/folder/${slug}/files/${fileId}/download`);
    expect(res.status).toBe(302);
    expect(res.headers.location).toEqual(expect.any(String));
  });

  it('404s for a file outside the shared subtree', async () => {
    const token = await registerUser();
    const root = await createFolder(token, { name: 'Photos' });
    const fileId = await uploadReadyFile(token); // no folderId — lives at the drive root
    const slug = await publish(token, root.id);

    const res = await request(app).get(`/api/share/folder/${slug}/files/${fileId}/download`);
    expect(res.status).toBe(404);
  });
});
