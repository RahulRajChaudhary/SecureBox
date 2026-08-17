

import crypto from 'node:crypto';
import {
  S3Client,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const BUCKET = process.env.S3_BUCKET;
const REGION = process.env.S3_REGION;
const PART_SIZE = 5 * 1024 * 1024; // 5 MiB — S3's multipart minimum (except the last part)
const TOTAL_SIZE = 12 * 1024 * 1024; // spans 3 parts: 5 + 5 + 2 MiB
const KEY = `spike/${crypto.randomUUID()}.bin`;

const s3 = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_KEY,
  },
});

function fakeFile(size) {
  return crypto.randomBytes(size);
}

async function main() {
  console.log(`bucket=${BUCKET} region=${REGION} key=${KEY}`);

  const file = fakeFile(TOTAL_SIZE);
  const parts = [];
  for (let offset = 0; offset < file.length; offset += PART_SIZE) {
    parts.push(file.subarray(offset, offset + PART_SIZE));
  }

  // 1. API's job: open the multipart upload, get an UploadId
  const create = await s3.send(
    new CreateMultipartUploadCommand({ Bucket: BUCKET, Key: KEY }),
  );
  const uploadId = create.UploadId;
  console.log(`multipart upload opened: ${uploadId}`);

  // 2. API's job: sign one PUT URL per part. Browser's job: PUT bytes directly to S3.
  const uploadedParts = [];
  for (let i = 0; i < parts.length; i++) {
    const partNumber = i + 1;
    const url = await getSignedUrl(
      s3,
      new UploadPartCommand({
        Bucket: BUCKET,
        Key: KEY,
        UploadId: uploadId,
        PartNumber: partNumber,
      }),
      { expiresIn: 300 },
    );

    // Simulates the browser: raw PUT to the presigned URL, API never touches these bytes.
    const res = await fetch(url, { method: 'PUT', body: parts[i] });
    if (!res.ok) throw new Error(`part ${partNumber} upload failed: ${res.status}`);

    const etag = res.headers.get('etag');
    uploadedParts.push({ ETag: etag, PartNumber: partNumber });
    console.log(`part ${partNumber}/${parts.length} uploaded, ${parts[i].length} bytes, etag=${etag}`);
  }

  // 3. API's job: complete the upload, then verify server-side — never trust the client's manifest.
  await s3.send(
    new CompleteMultipartUploadCommand({
      Bucket: BUCKET,
      Key: KEY,
      UploadId: uploadId,
      MultipartUpload: { Parts: uploadedParts },
    }),
  );
  console.log('multipart upload completed');

  const head = await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: KEY }));
  console.log(`HeadObject: size=${head.ContentLength} (expected ${TOTAL_SIZE})`);
  if (Number(head.ContentLength) !== TOTAL_SIZE) {
    throw new Error('uploaded size does not match expected size');
  }

  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: KEY }));
  console.log('cleanup: test object deleted');
  console.log('SPIKE PASSED: presigned multipart upload works end to end');
}

main().catch((err) => {
  console.error('SPIKE FAILED:', err);
  process.exitCode = 1;
});
