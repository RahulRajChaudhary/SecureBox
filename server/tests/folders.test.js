import crypto from 'node:crypto';
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';

async function registerUser() {
  const email = `${crypto.randomUUID()}@example.com`;
  const res = await request(app).post('/api/auth/register').send({ email, password: 'correct-horse-battery' });
  return res.body.accessToken;
}

async function createFolder(token, { name = 'Docs', parentId } = {}) {
  return request(app)
    .post('/api/folders')
    .set('Authorization', `Bearer ${token}`)
    .send({ name, parentId });
}

describe('POST /api/folders', () => {
  it('creates a root folder', async () => {
    const token = await registerUser();
    const res = await createFolder(token, { name: 'Photos' });

    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('Photos');
    expect(res.body.data.parentId).toBeNull();
  });

  it('creates a nested folder under a valid parent', async () => {
    const token = await registerUser();
    const parent = await createFolder(token, { name: 'Photos' });
    const res = await createFolder(token, { name: '2026', parentId: parent.body.data.id });

    expect(res.status).toBe(201);
    expect(res.body.data.parentId).toBe(parent.body.data.id);
  });

  it('rejects a non-existent parentId with 404', async () => {
    const token = await registerUser();
    const res = await createFolder(token, { parentId: crypto.randomUUID() });
    expect(res.status).toBe(404);
  });

  it('rejects missing name with 400', async () => {
    const token = await registerUser();
    const res = await request(app).post('/api/folders').set('Authorization', `Bearer ${token}`).send({});
    expect(res.status).toBe(400);
  });

  it('rejects an unauthenticated request with 401', async () => {
    const res = await request(app).post('/api/folders').send({ name: 'Photos' });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/folders', () => {
  it('lists only root folders when no parentId is given', async () => {
    const token = await registerUser();
    const root = await createFolder(token, { name: 'Photos' });
    await createFolder(token, { name: '2026', parentId: root.body.data.id });

    const res = await request(app).get('/api/folders').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.map((f) => f.name)).toEqual(['Photos']);
  });

  it('lists children when parentId is given', async () => {
    const token = await registerUser();
    const root = await createFolder(token, { name: 'Photos' });
    await createFolder(token, { name: '2026', parentId: root.body.data.id });

    const res = await request(app)
      .get(`/api/folders?parentId=${root.body.data.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.map((f) => f.name)).toEqual(['2026']);
  });
});

describe('GET /api/folders?q=', () => {
  it('matches folder names by case-insensitive substring', async () => {
    const token = await registerUser();
    await createFolder(token, { name: 'Invoices' });
    await createFolder(token, { name: 'Photos' });

    const res = await request(app).get('/api/folders?q=VOIC').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.map((f) => f.name)).toEqual(['Invoices']);
  });

  it('ignores parentId scoping and finds nested folders from root', async () => {
    const token = await registerUser();
    const root = await createFolder(token, { name: 'Photos' });
    await createFolder(token, { name: 'Vacation 2026', parentId: root.body.data.id });

    const res = await request(app).get('/api/folders?q=vacation').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.map((f) => f.name)).toEqual(['Vacation 2026']);
  });

  it('q and parentId together still search whole-drive, not just the parentId scope', async () => {
    const token = await registerUser();
    const root = await createFolder(token, { name: 'Photos' });
    const nested = await createFolder(token, { name: 'Vacation 2026', parentId: root.body.data.id });
    const other = await createFolder(token, { name: 'Docs' });

    const res = await request(app)
      .get(`/api/folders?q=vacation&parentId=${other.body.data.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.map((f) => f.id)).toEqual([nested.body.data.id]);
  });
});

describe('GET /api/folders/:id', () => {
  it('returns a root-first breadcrumb', async () => {
    const token = await registerUser();
    const root = await createFolder(token, { name: 'Photos' });
    const child = await createFolder(token, { name: '2026', parentId: root.body.data.id });

    const res = await request(app).get(`/api/folders/${child.body.data.id}`).set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.breadcrumb).toEqual([
      { id: root.body.data.id, name: 'Photos' },
      { id: child.body.data.id, name: '2026' },
    ]);
  });
});

describe('PATCH /api/folders/:id', () => {
  it('renames a folder', async () => {
    const token = await registerUser();
    const folder = await createFolder(token, { name: 'Photos' });

    const res = await request(app)
      .patch(`/api/folders/${folder.body.data.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Pictures' });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Pictures');
  });

  it('moves a folder under a new parent', async () => {
    const token = await registerUser();
    const a = await createFolder(token, { name: 'A' });
    const b = await createFolder(token, { name: 'B' });

    const res = await request(app)
      .patch(`/api/folders/${b.body.data.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ parentId: a.body.data.id });

    expect(res.status).toBe(200);
    expect(res.body.data.parentId).toBe(a.body.data.id);
  });

  it('rejects moving a folder into itself with 409', async () => {
    const token = await registerUser();
    const folder = await createFolder(token, { name: 'A' });

    const res = await request(app)
      .patch(`/api/folders/${folder.body.data.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ parentId: folder.body.data.id });

    expect(res.status).toBe(409);
  });

  it('rejects moving a folder into its own descendant with 409', async () => {
    const token = await registerUser();
    const parent = await createFolder(token, { name: 'A' });
    const child = await createFolder(token, { name: 'B', parentId: parent.body.data.id });

    const res = await request(app)
      .patch(`/api/folders/${parent.body.data.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ parentId: child.body.data.id });

    expect(res.status).toBe(409);
  });
});

describe('DELETE /api/folders/:id', () => {
  it('deletes an empty folder', async () => {
    const token = await registerUser();
    const folder = await createFolder(token, { name: 'Photos' });

    const res = await request(app).delete(`/api/folders/${folder.body.data.id}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(204);
  });

  it('rejects deleting a non-empty folder with 409 FOLDER_NOT_EMPTY', async () => {
    const token = await registerUser();
    const parent = await createFolder(token, { name: 'Photos' });
    await createFolder(token, { name: '2026', parentId: parent.body.data.id });

    const res = await request(app).delete(`/api/folders/${parent.body.data.id}`).set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('FOLDER_NOT_EMPTY');
  });
});

describe('Authorization — user B cannot touch user A\'s folders', () => {
  async function setup() {
    const tokenA = await registerUser();
    const tokenB = await registerUser();
    const folder = await createFolder(tokenA, { name: 'Photos' });
    return { tokenB, folderId: folder.body.data.id };
  }

  it('get → 404', async () => {
    const { tokenB, folderId } = await setup();
    const res = await request(app).get(`/api/folders/${folderId}`).set('Authorization', `Bearer ${tokenB}`);
    expect(res.status).toBe(404);
  });

  it('patch → 404', async () => {
    const { tokenB, folderId } = await setup();
    const res = await request(app)
      .patch(`/api/folders/${folderId}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ name: 'Mine now' });
    expect(res.status).toBe(404);
  });

  it('delete → 404', async () => {
    const { tokenB, folderId } = await setup();
    const res = await request(app).delete(`/api/folders/${folderId}`).set('Authorization', `Bearer ${tokenB}`);
    expect(res.status).toBe(404);
  });
});

describe('Files scoped by folder', () => {
  it('upload-intent into a non-existent folder is rejected with 404', async () => {
    const token = await registerUser();
    const res = await request(app)
      .post('/api/files/upload-intent')
      .set('Authorization', `Bearer ${token}`)
      .send({ filename: 'photo.png', sizeBytes: 1024, mimeType: 'image/png', folderId: crypto.randomUUID() });

    expect(res.status).toBe(404);
  });

  it('a file listing with folderId only returns intents opened in that folder', async () => {
    const token = await registerUser();
    const folder = await createFolder(token, { name: 'Photos' });

    const inFolder = await request(app)
      .post('/api/files/upload-intent')
      .set('Authorization', `Bearer ${token}`)
      .send({ filename: 'a.png', sizeBytes: 1024, mimeType: 'image/png', folderId: folder.body.data.id });
    expect(inFolder.status).toBe(201);
    expect(inFolder.body.data.fileId).toEqual(expect.any(String));
  });
});
