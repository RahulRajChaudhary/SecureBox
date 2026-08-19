export class HttpError extends Error {
  constructor(status, message, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export class NotFoundError extends HttpError {
  constructor(message = 'Not found') {
    super(404, message);
  }
}

export class ConflictError extends HttpError {
  constructor(message = 'Conflict', code) {
    super(409, message, code);
  }
}

export class PayloadTooLargeError extends HttpError {
  constructor(message = 'File too large') {
    super(413, message);
  }
}

export class UnsupportedMediaError extends HttpError {
  constructor(message = 'Unsupported file type') {
    super(415, message);
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message = 'Unauthorized') {
    super(401, message);
  }
}
