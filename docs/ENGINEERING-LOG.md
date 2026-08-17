# Engineering Log

Short entries: issue → fix → why it mattered. New entries added as they happen.

---

**npm audit: 5 vulnerabilities (1 critical) after install**
Traced to `esbuild` inside `vitest`/`vite` — dev-server only, never ships
to prod. Checked blast radius before fixing instead of reflex-running
`--force`. Ran it anyway since no tests existed yet (free major bump).
→ 0 vulnerabilities, `vitest` on v4.

**git repo was scoped to `C:\` (whole drive)**
`git status` showed `../../Windows`, `../../Users` etc. Ran `git
rev-parse --show-toplevel` and confirmed `.git` was at the drive root,
not the project folder. Avoided `git add -A` there — would've staged
the entire OS. Scaffolded project without git until a repo can be
init'd inside the project folder itself.

**Scaffolded Express server + auth flow (register/login/refresh/logout)**
Access JWT (15m) + opaque refresh token, hashed and stored in `Session`.
Refresh rotates the token and reuse of an already-rotated token revokes the
whole `familyId` (breach detection). Used Node 24's `--env-file` instead of
adding a `dotenv` dependency.
→ Smoke-tested full flow against local Postgres: register, login, wrong-password
rejection, refresh rotation, logout, and post-logout refresh all behaved.

**Wrote the 17-case auth test suite — found a live bug first**
Express 4 (installed: 4.22.2) doesn't auto-catch rejected promises from async
route handlers, so a thrown `ZodError` in `register` would never reach
`errorHandler` — the request just hangs. Added a 5-line `asyncHandler` wrap
instead of pulling in `express-async-errors`. Also had to `skip` the auth
rate limiter and silence `pino-http` when `NODE_ENV=test`, since the suite
otherwise trips the 20-req/15min limiter and drowns test output in request logs.
→ `npm test`: 17/17 green.

**Day-0 spike: presigned multipart upload, real S3 (`ap-southeast-2`)**
Dropped MinIO/Docker per project decision — spike script hits a real bucket
via `@aws-sdk/client-s3`. Also caught: the `file-type` package needs real
chunk structure past the magic bytes, not just the 8-byte PNG signature —
matters for the `sniffMimeType` tests below.
→ 3-part (5+5+2 MiB) upload → complete → HeadObject size check → cleanup, passed end to end.

**Built the upload pipeline (intent → parts → complete → verify, resume/abort,
file CRUD, share links, reconciler)**
Followed `03-upload-pipeline.md` almost verbatim, adapted to what Phase 1
actually built: `requireAuth` sets `req.userId` (not `req.user`), routes are
unversioned `/api/...` to match `/api/auth`. `files.repository.updateFile`
uses `updateMany` scoped to `{ id, ownerId, deletedAt: null }` rather than a
plain `update` by id — the doc's "every method scopes to ownerId" rule
applies to writes too, not just reads. Known gap, not fixed: `file-type`
can't magic-byte-detect plain-text formats (`text/plain`, `.csv`, `.md`,
`application/json`), so those allowed MIME types will fail server-side
verification on `complete` today — needs a text-format fallback later.
→ 19/19 new tests green (intent validation, server-verified complete,
idempotent complete, 404-not-403 across 5 endpoints, share slug rotation).
`npm test`: 36/36 total.

---
