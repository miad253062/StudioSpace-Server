# AGENTS.md

Single-file Express 5 API for the StudioSpace course project. The frontend is a **separate repo** at `../studio-space-client` (Next.js 16 + better-auth) with its own `node_modules` — see its `AGENTS.md` when working there.

## Commands

- Run: `node index.js` — there is **no** `npm start`, and `npm test` exits 1 by design. No lint/typecheck/test tooling exists in this repo; verify manually with `curl http://localhost:8000/` (returns `hello world`).
- Requires a root `.env` (gitignored): `DB_USERNAME`, `DB_PASSWORD`, `CLIENT_URL`, optional `PORT` (default 8000). Loaded via side-effect `import "dotenv/config"` at the top of `index.js`. Never commit `.env`.

## Startup gotcha

- The server **crashes on boot if MongoDB is unreachable**: `index.js` runs a top-level `await connectToMongoDB()` and calls `.db()` on the result. A failed connect only logs the error, then throws a `TypeError`. DB credentials are a startup prerequisite, not just a runtime one.
- Connection string, DB name, and collections are hardcoded in `index.js`: Atlas host `cluster0.eimgd93.mongodb.net`, database `StudioSpaceServer`, collections `studios` and `bookings`.

## Auth

- The `verifyApi` JWT middleware is applied to four routes: `POST /add-studio`, `POST /bookings`, `DELETE /delete/:id`, `DELETE /bookings/:id`. Everything else is unauthenticated.
- It verifies Bearer tokens against `${CLIENT_URL}/api/auth/jwks`, served by the sibling client's better-auth catch-all (`src/app/api/auth/[...all]/route.ts`). The client dev server (`npm run dev` in `../studio-space-client`, port 3000) must be running for those four routes to succeed — otherwise they return 401.
- `CLIENT_URL` must be the bare origin with **no trailing slash** (the URL is built as `${CLIENT_URL}/api/auth/jwks`).

## Code style & conventions

- ESM only (`"type": "module"`) with top-level `await` — keep `import` syntax; don't convert to CommonJS.
- Express **5**, not 4: rejected promises from handlers are auto-forwarded to the error handler (500). Existing routes still use `try/catch` and `res.status(500).send({ error: ... })` — match that style.
- Miss lookups on `/studios/:id` and `/studios/edit/:id` return HTTP 200 with `{ message: 'No data found!' }` — the client may rely on this; preserve the contract.
- `POST /bookings` returns 409 for a duplicate (email + `studio._id` + date).
