import { ZodError } from 'zod';

export function notFound(req, res) {
  res.status(404).json({ error: 'Not found' });
}

export function errorHandler(err, req, res, next) {
  if (err instanceof ZodError) {
    return res.status(400).json({ error: 'Validation failed', details: err.flatten() });
  }

  req.log?.error({ err }, 'unhandled error');
  const status = err.status ?? 500;
  const body = { error: status === 500 ? 'Internal server error' : err.message };
  if (status !== 500 && err.code) body.code = err.code;
  res.status(status).json(body);
}
