import crypto from 'node:crypto';
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';

const REAL_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64',
);

// Magic-byte prefixes are enough for file-type's sniffMimeType() to
// classify these — it only inspects the header, not full file structure.
const MAGIC_BYTES = {
  'image/png': REAL_PNG,
  'application/pdf': Buffer.from('255044462d312e340a25e2e3cfd30a', 'hex'), // "%PDF-1.4\n%...."
  'application/zip': Buffer.from('504b0304140000000800', 'hex'),
};

function fileBuffer(mimeType, size) {
  const header = MAGIC_BYTES[mimeType];
  return Buffer.concat([header, crypto.randomBytes(Math.max(size - header.length, 0))]);
}

async function registerUser() {
  const email = `${crypto.randomUUID()}@example.com`;
  const res = await request(app).post('/api/auth/register').send({ email, password: 'correct-horse-battery' });
  return res.body.accessToken;
}

async function createReadyFile(token, sizeBytes = 1024, mimeType = 'image/png', filename = 'photo.png') {
  const intent = await request(app)
    .post('/api/files/upload-intent')
    .set('Authorization', `Bearer ${token}`)
    .send({ filename, sizeBytes, mimeType });
  const { fileId, partSize, partUrls } = intent.body.data;
  const buf = fileBuffer(mimeType, sizeBytes);
  for (const { partNumber, url } of partUrls) {
    const start = (partNumber - 1) * partSize;
    const chunk = buf.subarray(start, start + partSize);
    const res = await fetch(url, { method: 'PUT', body: chunk });
    if (!res.ok) throw new Error(`part ${partNumber} upload failed: ${res.status}`);
  }
  const res = await request(app).post(`/api/files/${fileId}/complete`).set('Authorization', `Bearer ${token}`);
  return { fileId, res };
}

describe('GET /api/files/stats', () => {
  it('counts only READY, non-deleted files in totalFiles', async () => {
    const token = await registerUser();
    const { fileId } = await createReadyFile(token, 1024);
    await createReadyFile(token, 2048);
    await request(app).delete(`/api/files/${fileId}`).set('Authorization', `Bearer ${token}`);
    await request(app)
      .post('/api/files/upload-intent')
      .set('Authorization', `Bearer ${token}`)
      .send({ filename: 'pending.png', sizeBytes: 1024, mimeType: 'image/png' }); // left PENDING

    const res = await request(app).get('/api/files/stats').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.totalFiles).toBe(1);
  }, 20000);

  it('matches usedBytes/limitBytes reported by /usage', async () => {
    const token = await registerUser();
    await createReadyFile(token, 1024);
    await createReadyFile(token, 2048);

    const [statsRes, usageRes] = await Promise.all([
      request(app).get('/api/files/stats').set('Authorization', `Bearer ${token}`),
      request(app).get('/api/files/usage').set('Authorization', `Bearer ${token}`),
    ]);

    expect(statsRes.body.data.usedBytes).toBe(usageRes.body.data.usedBytes);
    expect(statsRes.body.data.limitBytes).toBe(usageRes.body.data.limitBytes);
  }, 20000);

  it('counts files with an active public share link in publicFileCount', async () => {
    const token = await registerUser();
    const { fileId } = await createReadyFile(token, 1024);
    await createReadyFile(token, 1024);

    let res = await request(app).get('/api/files/stats').set('Authorization', `Bearer ${token}`);
    expect(res.body.data.publicFileCount).toBe(0);

    await request(app)
      .patch(`/api/files/${fileId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ visibility: 'PUBLIC' });

    res = await request(app).get('/api/files/stats').set('Authorization', `Bearer ${token}`);
    expect(res.body.data.publicFileCount).toBe(1);
  }, 20000);

  it('counts freshly uploaded files in recentUploadCount', async () => {
    const token = await registerUser();
    await createReadyFile(token, 1024);
    await createReadyFile(token, 1024);

    const res = await request(app).get('/api/files/stats').set('Authorization', `Bearer ${token}`);

    // Files were just created, so both fall inside the 7-day window. The
    // window boundary itself isn't independently exercised — there's no
    // existing test precedent in this repo for backdating createdAt.
    expect(res.body.data.recentUploadCount).toBe(2);
  }, 20000);

  it('breaks storage down by mimeType with correct count and sizeBytes', async () => {
    const token = await registerUser();
    await createReadyFile(token, 1024, 'image/png', 'photo.png');
    await createReadyFile(token, 2048, 'image/png', 'photo2.png');
    await createReadyFile(token, 4096, 'application/pdf', 'doc.pdf');

    const res = await request(app).get('/api/files/stats').set('Authorization', `Bearer ${token}`);

    const byType = Object.fromEntries(res.body.data.byMimeType.map((g) => [g.mimeType, g]));
    expect(byType['image/png']).toEqual({ mimeType: 'image/png', count: 2, sizeBytes: '3072' });
    expect(byType['application/pdf']).toEqual({ mimeType: 'application/pdf', count: 1, sizeBytes: '4096' });
  }, 20000);

  it('returns zeros for a user with no files', async () => {
    const token = await registerUser();
    const res = await request(app).get('/api/files/stats').set('Authorization', `Bearer ${token}`);

    expect(res.body.data).toMatchObject({
      totalFiles: 0,
      usedBytes: '0',
      publicFileCount: 0,
      recentUploadCount: 0,
      byMimeType: [],
    });
  });

  it('rejects an unauthenticated request with 401', async () => {
    const res = await request(app).get('/api/files/stats');
    expect(res.status).toBe(401);
  });
});
