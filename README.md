# SecureBox

A secure file storage service. Users register/log in, upload files of any size (multipart upload for large files), organize them into folders, and choose whether each file or folder is public (shareable via link) or private (owner-only).

**Live:** https://secure-box-henna.vercel.app
**API:** https://securebox-production.up.railway.app

## Tech stack

- **Frontend:** React 18 + Vite, React Router, TanStack Query, Tailwind, Framer Motion
- **Backend:** Node.js + Express, Zod validation, Prisma ORM
- **Database:** PostgreSQL
- **Storage:** AWS S3 (pre-signed URLs, multipart upload)
- **Auth:** JWT access + refresh tokens, Google OAuth (argon2 password hashing)

## Features

- Email/password auth + Google sign-in
- Multipart S3 upload for large files, with client-side progress
- Folders with nesting, move/rename/delete
- Per-file and per-folder visibility (`PRIVATE` / `PUBLIC`) with shareable links
- Server-side MIME verification (magic-byte sniffing via `file-type`, not just trusting the client's declared type)
- Per-user storage quota (2GB) with usage tracking
- Trash / restore, recent files, storage stats dashboard
- Rate limiting on auth endpoints

## Project structure

```
server/   Express API (src/modules/<domain>/{routes,controller,service,repository,schemas}.js)
web/      React SPA (src/pages, src/components, src/hooks, src/lib)
docs/     Architecture notes, build log
```

## Local setup

### Prerequisites
- Node.js 20+
- PostgreSQL running locally (or a connection string to a hosted instance)
- An AWS S3 bucket + IAM user with read/write access to it

### 1. Backend

```bash
cd server
npm install
cp ../.env.example .env   # fill in DATABASE_URL, S3_*, JWT_ACCESS_SECRET, COOKIE_SECRET
npx prisma migrate dev
npm run dev                # http://localhost:3001
```

### 2. Frontend

```bash
cd web
npm install
echo "VITE_GOOGLE_CLIENT_ID=your-google-oauth-client-id" > .env.local  # optional, only needed for Google sign-in
npm run dev                # http://localhost:5173
```

The frontend proxies `/api/*` to the backend in dev (see `vite.config.js`); in production this is handled by a Vercel rewrite (`web/vercel.json`) to the Railway-hosted API.

### Environment variables

See `.env.example` at the repo root for the full list (DB connection, S3 credentials, JWT/cookie secrets, CORS origin).

## Tests

```bash
cd server && npm test    # vitest — auth, uploads, folders, sharing, visibility, quotas, rate limits
cd web && npm test       # vitest — component/unit tests
```

## Security notes

- Passwords hashed with argon2; JWT access tokens are short-lived, paired with a rotating refresh token stored as an httpOnly cookie
- File downloads/previews use short-lived (60s), single-object pre-signed S3 URLs — the app never proxies file bytes or exposes long-lived credentials
- Uploaded file content is verified against its actual bytes server-side, not just the client-supplied MIME type
- `helmet` + explicit CSP on the API; CORS restricted to the configured frontend origin
- Known gap: no virus/malware scanning on uploaded files
