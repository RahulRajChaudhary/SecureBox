import {
  CreateMultipartUploadCommand,
  UploadPartCommand,
  ListPartsCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
  HeadObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3 } from '../lib/s3.js';
import { env } from '../config/env.js';
import { PRESIGNED_URL_EXPIRES, DOWNLOAD_URL_EXPIRES } from '../config/upload.constants.js';

export async function createMultipartUpload({ storageKey, mimeType }) {
  const res = await s3.send(
    new CreateMultipartUploadCommand({ Bucket: env.S3_BUCKET, Key: storageKey, ContentType: mimeType }),
  );
  return { UploadId: res.UploadId };
}

export async function signPartUrls({ storageKey, uploadId, totalParts }) {
  const partUrls = [];
  for (let partNumber = 1; partNumber <= totalParts; partNumber++) {
    const url = await getSignedUrl(
      s3,
      new UploadPartCommand({ Bucket: env.S3_BUCKET, Key: storageKey, UploadId: uploadId, PartNumber: partNumber }),
      { expiresIn: PRESIGNED_URL_EXPIRES },
    );
    partUrls.push({ partNumber, url });
  }
  return partUrls;
}

export async function signSpecificPartUrls({ storageKey, uploadId, partNumbers }) {
  return Promise.all(
    partNumbers.map(async (partNumber) => {
      const url = await getSignedUrl(
        s3,
        new UploadPartCommand({ Bucket: env.S3_BUCKET, Key: storageKey, UploadId: uploadId, PartNumber: partNumber }),
        { expiresIn: PRESIGNED_URL_EXPIRES },
      );
      return { partNumber, url };
    }),
  );
}

export async function listParts({ storageKey, uploadId }) {
  const parts = [];
  let partNumberMarker;
  let isTruncated = true;

  while (isTruncated) {
    const res = await s3.send(
      new ListPartsCommand({
        Bucket: env.S3_BUCKET,
        Key: storageKey,
        UploadId: uploadId,
        PartNumberMarker: partNumberMarker,
      }),
    );
    parts.push(...(res.Parts ?? []));
    isTruncated = Boolean(res.IsTruncated);
    partNumberMarker = res.NextPartNumberMarker;
  }

  return parts.sort((a, b) => a.PartNumber - b.PartNumber);
}

export async function completeMultipartUpload({ storageKey, uploadId, parts }) {
  return s3.send(
    new CompleteMultipartUploadCommand({
      Bucket: env.S3_BUCKET,
      Key: storageKey,
      UploadId: uploadId,
      MultipartUpload: { Parts: parts },
    }),
  );
}

export async function abortMultipartUpload({ storageKey, uploadId }) {
  return s3.send(
    new AbortMultipartUploadCommand({ Bucket: env.S3_BUCKET, Key: storageKey, UploadId: uploadId }),
  );
}

export async function headObject({ storageKey }) {
  return s3.send(new HeadObjectCommand({ Bucket: env.S3_BUCKET, Key: storageKey }));
}

export async function getRangedBytes({ storageKey, start, end }) {
  const res = await s3.send(
    new GetObjectCommand({ Bucket: env.S3_BUCKET, Key: storageKey, Range: `bytes=${start}-${end}` }),
  );
  const chunks = [];
  for await (const chunk of res.Body) chunks.push(chunk);
  return Buffer.concat(chunks);
}

export async function deleteObject({ storageKey }) {
  return s3.send(new DeleteObjectCommand({ Bucket: env.S3_BUCKET, Key: storageKey }));
}

export async function getPresignedDownloadUrl({ storageKey, filename }) {
  return getSignedUrl(
    s3,
    new GetObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: storageKey,
      ResponseContentDisposition: `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
    }),
    { expiresIn: DOWNLOAD_URL_EXPIRES },
  );
}
