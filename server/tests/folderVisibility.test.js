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
  return request(app).post('/api/folders').set('Authorization', `Bearer ${token}`).send({ name, parentId });
}

describe('PATCH /api/folders/:id — visibility', () => {
  it('defaults to PRIVATE with no shareSlug', async () => {
    const token = await registerUser();
    const folder = await createFolder(token);
    expect(folder.body.data.visibility).toBe('PRIVATE');
    expect(folder.body.data.shareSlug).toBeNull();
  });

  it('generates a shareSlug on first publish', async () => {
    const token = await registerUser();
    const folder = await createFolder(token);

    const res = await request(app)
      .patch(`/api/folders/${folder.body.data.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ visibility: 'PUBLIC' });

    expect(res.status).toBe(200);
    expect(res.body.data.visibility).toBe('PUBLIC');
    expect(res.body.data.shareSlug).toEqual(expect.any(String));
  });

  it('keeps the same shareSlug across republishes', async () => {
    const token = await registerUser();
    const folder = await createFolder(token);

    const first = await request(app)
      .patch(`/api/folders/${folder.body.data.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ visibility: 'PUBLIC' });
    const second = await request(app)
      .patch(`/api/folders/${folder.body.data.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ visibility: 'PUBLIC' });

    expect(second.body.data.shareSlug).toBe(first.body.data.shareSlug);
  });

  it('nulls the shareSlug when unpublished', async () => {
    const token = await registerUser();
    const folder = await createFolder(token);

    await request(app)
      .patch(`/api/folders/${folder.body.data.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ visibility: 'PUBLIC' });
    const res = await request(app)
      .patch(`/api/folders/${folder.body.data.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ visibility: 'PRIVATE' });

    expect(res.status).toBe(200);
    expect(res.body.data.visibility).toBe('PRIVATE');
    expect(res.body.data.shareSlug).toBeNull();
  });
});
