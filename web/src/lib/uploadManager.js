import { createUploadIntent, resumeUpload, completeUpload, abortUpload } from './files';

const CONCURRENCY = 4;
const MAX_RETRIES = 3;
const RETRY_BASE_MS = 500;

function uploadPart(url, blob, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(e.loaded);
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress(blob.size);
        resolve();
      } else {
        reject(new Error(`Part upload failed: ${xhr.status}`));
      }
    };
    xhr.onerror = () => reject(new Error('Network error during part upload'));
    xhr.onabort = () => reject(new AbortError());
    xhr.send(blob);
    onProgress.abort = () => xhr.abort();
  });
}

class AbortError extends Error {
  constructor() {
    super('aborted');
    this.name = 'AbortError';
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Framework-agnostic upload engine. Splits a File into S3 multipart parts,
// PUTs each directly to its presigned URL with XHR (only place in the app
// that isn't fetch — XHR is the only way to get upload progress events),
// retries transient failures, and supports pause/resume across a page
// reload as long as the fileId is kept.
export class UploadManager {
  constructor(file, { onProgress, onStatusChange } = {}) {
    this.file = file;
    this.onProgress = onProgress ?? (() => {});
    this.onStatusChange = onStatusChange ?? (() => {});

    this.fileId = null;
    this.partSize = null;
    this.totalParts = 0;
    this.partBytesUploaded = new Map(); // partNumber -> bytes uploaded so far
    this.completedParts = new Set();
    this.paused = false;
    this.aborted = false;
    this.inFlight = new Map(); // partNumber -> abort() fn
  }

  setStatus(status, extra) {
    this.status = status;
    this.onStatusChange(status, extra);
  }

  emitProgress() {
    const uploaded = [...this.partBytesUploaded.values()].reduce((a, b) => a + b, 0);
    this.onProgress(Math.min(uploaded, this.file.size), this.file.size);
  }

  async start() {
    this.setStatus('creating-intent');
    const { data } = await createUploadIntent({
      filename: this.file.name,
      sizeBytes: this.file.size,
      mimeType: this.file.type || 'application/octet-stream',
    });
    this.fileId = data.fileId;
    this.partSize = data.partSize;
    this.totalParts = data.totalParts;
    await this.runParts(data.partUrls);
  }

  async runParts(partUrls) {
    this.paused = false;
    this.setStatus('uploading');

    const queue = partUrls.filter((p) => !this.completedParts.has(p.partNumber));
    let cursor = 0;
    let firstError = null;

    const worker = async () => {
      while (cursor < queue.length) {
        if (this.paused || this.aborted) return;
        const part = queue[cursor++];
        try {
          await this.uploadOnePart(part);
        } catch (err) {
          if (err.name === 'AbortError') return;
          firstError = firstError ?? err;
          return;
        }
      }
    };

    await Promise.all(Array.from({ length: CONCURRENCY }, worker));

    if (this.aborted) return;
    if (this.paused) {
      this.setStatus('paused');
      return;
    }
    if (firstError) {
      this.setStatus('error', firstError);
      return;
    }
    await this.finish();
  }

  async uploadOnePart(part, attempt = 1) {
    const start = (part.partNumber - 1) * this.partSize;
    const blob = this.file.slice(start, Math.min(start + this.partSize, this.file.size));

    const onProgress = (bytes) => {
      this.partBytesUploaded.set(part.partNumber, bytes);
      this.emitProgress();
    };
    this.inFlight.set(part.partNumber, () => onProgress.abort?.());

    try {
      await uploadPart(part.url, blob, onProgress);
      this.completedParts.add(part.partNumber);
      this.inFlight.delete(part.partNumber);
    } catch (err) {
      this.inFlight.delete(part.partNumber);
      if (err.name === 'AbortError') throw err;
      if (attempt >= MAX_RETRIES) throw err;
      await sleep(RETRY_BASE_MS * 2 ** (attempt - 1));
      return this.uploadOnePart(part, attempt + 1);
    }
  }

  async finish() {
    this.setStatus('completing');
    const { data } = await completeUpload(this.fileId);
    this.setStatus('done', data);
  }

  pause() {
    if (this.status !== 'uploading') return;
    this.paused = true;
    for (const abort of this.inFlight.values()) abort();
    this.inFlight.clear();
  }

  async resume() {
    if (!this.fileId) return this.start();
    const missingParts = Array.from({ length: this.totalParts }, (_, i) => i + 1).filter(
      (n) => !this.completedParts.has(n),
    );
    if (missingParts.length === 0) return this.finish();
    const { data } = await resumeUpload(this.fileId, missingParts);
    await this.runParts(data.partUrls);
  }

  async abort() {
    this.aborted = true;
    for (const abort of this.inFlight.values()) abort();
    this.inFlight.clear();
    if (this.fileId) await abortUpload(this.fileId).catch(() => {});
    this.setStatus('aborted');
  }
}
