import crypto from 'node:crypto';
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';

// A real minimal 1x1 transparent PNG — file-type validates chunk structure
// past the 8-byte signature, so a fake signature alone won't detect.
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

async function openIntent(token, { filename = 'photo.png', sizeBytes = 1024, mimeType = 'image/png' } = {}) {
  const res = await request(app)
    .post('/api/files/upload-intent')
    .set('Authorization', `Bearer ${token}`)
    .send({ filename, sizeBytes, mimeType });
  return res;
}

async function uploadAllParts(partUrls, buf, partSize) {
  for (const { partNumber, url } of partUrls) {
    const start = (partNumber - 1) * partSize;
    const chunk = buf.subarray(start, start + partSize);
    const res = await fetch(url, { method: 'PUT', body: chunk });
    if (!res.ok) throw new Error(`part ${partNumber} upload failed: ${res.status}`);
  }
}

// Full real round trip: intent -> upload every part to S3 -> complete.
async function createReadyFile(token, sizeBytes = 1024) {
  const intent = await openIntent(token, { sizeBytes });
  const { fileId, partSize, partUrls } = intent.body.data;
  await uploadAllParts(partUrls, pngBuffer(sizeBytes), partSize);
  const res = await request(app).post(`/api/files/${fileId}/complete`).set('Authorization', `Bearer ${token}`);
  return { fileId, res };
}

describe('POST /api/files/upload-intent', () => {
  it('returns fileId/partUrls/partSize for a valid intent', async () => {
    const token = await registerUser();
    const res = await openIntent(token, { sizeBytes: 1024 });

    expect(res.status).toBe(201);
    expect(res.body.data.fileId).toEqual(expect.any(String));
    expect(res.body.data.partSize).toEqual(expect.any(Number));
    expect(res.body.data.partUrls).toEqual([{ partNumber: 1, url: expect.any(String) }]);
  });

  it('rejects a file over the 5 GB limit with 413', async () => {
    const token = await registerUser();
    const res = await openIntent(token, { sizeBytes: 6 * 1024 * 1024 * 1024 });

    expect(res.status).toBe(413);
  });

  it('rejects a blocked MIME type with 415', async () => {
    const token = await registerUser();
    const res = await openIntent(token, { filename: 'app.bin', mimeType: 'application/x-msdownload' });

    expect(res.status).toBe(415);
  });

  it('rejects a blocked extension with 415, even with an allowed MIME type', async () => {
    const token = await registerUser();
    const res = await openIntent(token, { filename: 'payload.svg', mimeType: 'image/svg+xml' });

    expect(res.status).toBe(415);
  });

  it('rejects missing fields with 400', async () => {
    const token = await registerUser();
    const res = await request(app)
      .post('/api/files/upload-intent')
      .set('Authorization', `Bearer ${token}`)
      .send({ filename: 'photo.png' });

    expect(res.status).toBe(400);
  });

  it('rejects an unauthenticated request with 401', async () => {
    const res = await request(app).post('/api/files/upload-intent').send({});
    expect(res.status).toBe(401);
  });
});

describe('POST /api/files/:id/complete', () => {
  it('completes after all parts are uploaded, verifying size and MIME server-side', async () => {
    const token = await registerUser();
    const { res } = await createReadyFile(token, 1024);

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('READY');
    expect(res.body.data.mimeType).toBe('image/png');
  }, 20000);

  it('rejects completion before all parts are uploaded with 409 INCOMPLETE_UPLOAD', async () => {
    const token = await registerUser();
    const sizeBytes = 11 * 1024 * 1024; // spans 2 parts (10 MiB + 1 MiB)
    const intent = await openIntent(token, { sizeBytes });
    const { fileId, partSize, partUrls } = intent.body.data;

    // Upload only the first part, deliberately skip the second.
    const buf = pngBuffer(sizeBytes);
    await uploadAllParts([partUrls[0]], buf, partSize);

    const res = await request(app).post(`/api/files/${fileId}/complete`).set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('INCOMPLETE_UPLOAD');
  }, 20000);

  it('is idempotent — calling complete twice both return 200 READY', async () => {
    const token = await registerUser();
    const { fileId, res: first } = await createReadyFile(token, 1024);
    expect(first.status).toBe(200);

    const second = await request(app).post(`/api/files/${fileId}/complete`).set('Authorization', `Bearer ${token}`);

    expect(second.status).toBe(200);
    expect(second.body.data.status).toBe('READY');
  }, 20000);

  it('rejects an unauthenticated request with 401', async () => {
    const res = await request(app).post(`/api/files/${crypto.randomUUID()}/complete`);
    expect(res.status).toBe(401);
  });
});

describe('Authorization — user B cannot touch user A\'s files', () => {
  async function setup() {
    const tokenA = await registerUser();
    const tokenB = await registerUser();
    const intent = await openIntent(tokenA, { sizeBytes: 1024 });
    return { tokenB, fileId: intent.body.data.fileId };
  }

  it('upload-status → 404', async () => {
    const { tokenB, fileId } = await setup();
    const res = await request(app).get(`/api/files/${fileId}/upload-status`).set('Authorization', `Bearer ${tokenB}`);
    expect(res.status).toBe(404);
  });

  it('complete → 404', async () => {
    const { tokenB, fileId } = await setup();
    const res = await request(app).post(`/api/files/${fileId}/complete`).set('Authorization', `Bearer ${tokenB}`);
    expect(res.status).toBe(404);
  });

  it('abort → 404', async () => {
    const { tokenB, fileId } = await setup();
    const res = await request(app).post(`/api/files/${fileId}/abort`).set('Authorization', `Bearer ${tokenB}`);
    expect(res.status).toBe(404);
  });

  it('delete → 404', async () => {
    const { tokenB, fileId } = await setup();
    const res = await request(app).delete(`/api/files/${fileId}`).set('Authorization', `Bearer ${tokenB}`);
    expect(res.status).toBe(404);
  });

  it('patch → 404', async () => {
    const { tokenB, fileId } = await setup();
    const res = await request(app)
      .patch(`/api/files/${fileId}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ visibility: 'PUBLIC' });
    expect(res.status).toBe(404);
  });
});

describe('Share links', () => {
  it('a newly-completed private file has no shareSlug', async () => {
    const token = await registerUser();
    const { res } = await createReadyFile(token, 1024);
    expect(res.body.data.shareSlug).toBeNull();
  }, 20000);

  it('toggling to PUBLIC generates a shareSlug, and the slug serves public metadata', async () => {
    const token = await registerUser();
    const { fileId } = await createReadyFile(token, 1024);

    const patchRes = await request(app)
      .patch(`/api/files/${fileId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ visibility: 'PUBLIC' });
    const slug = patchRes.body.data.shareSlug;
    expect(slug).toEqual(expect.any(String));

    const shareRes = await request(app).get(`/api/share/${slug}`);
    expect(shareRes.status).toBe(200);
    expect(shareRes.body.data.id).toBe(fileId);
  }, 20000);

  it('toggling back to PRIVATE kills the old slug (404) and a new PUBLIC toggle mints a fresh one', async () => {
    const token = await registerUser();
    const { fileId } = await createReadyFile(token, 1024);

    const toPublic = await request(app)
      .patch(`/api/files/${fileId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ visibility: 'PUBLIC' });
    const oldSlug = toPublic.body.data.shareSlug;

    await request(app).patch(`/api/files/${fileId}`).set('Authorization', `Bearer ${token}`).send({ visibility: 'PRIVATE' });

    const deadRes = await request(app).get(`/api/share/${oldSlug}`);
    expect(deadRes.status).toBe(404);

    const toPublicAgain = await request(app)
      .patch(`/api/files/${fileId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ visibility: 'PUBLIC' });
    const newSlug = toPublicAgain.body.data.shareSlug;

    expect(newSlug).not.toBe(oldSlug);
    const liveRes = await request(app).get(`/api/share/${newSlug}`);
    expect(liveRes.status).toBe(200);
  }, 20000);

  it('a private file 404s via the share endpoint', async () => {
    const token = await registerUser();
    const { fileId } = await createReadyFile(token, 1024);

    // fileId itself is not a valid slug and the file is private either way
    const res = await request(app).get(`/api/share/${fileId}`);
    expect(res.status).toBe(404);
  }, 20000);
});
