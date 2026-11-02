# Commonplace backend

MongoDB-backed API and authentication for the Commonplace frontend.

## Setup

1. Copy `.env.example` to `.env` and fill in the values.
2. Set `MONGODB_URI` to a MongoDB connection string and optionally choose `MONGODB_DB`.
3. Generate a `BETTER_AUTH_SECRET` with at least 32 characters.
4. Configure Google and GitHub OAuth apps. Set their callback URLs to:
   - `http://localhost:5000/api/auth/callback/google`
   - `http://localhost:5000/api/auth/callback/github`
5. In the frontend, set `NEXT_PUBLIC_API_URL=http://localhost:5000`.
6. Run `npm install`, then `npm run dev`.

The API listens on port 5000 by default. `CLIENT_ORIGIN` should match the frontend origin. It seeds the initial sample events only when the events collection is empty.

## API

- `GET /api/health` — readiness check.
- `GET /api/token` — exchange a valid Better Auth session cookie for a 15-minute HS256 Bearer token.
- `GET /api/events` and `GET /api/events/:id` — public event listings and details.
- `POST /api/events` — create an event (requires `Authorization: Bearer <token>`).
- `PATCH /api/events/:id` and `DELETE /api/events/:id` — update or delete your own event (Bearer token required).
- `POST /api/events/:id/join` — join an event (Bearer token required).
- `DELETE /api/events/:id/join` — leave an event (Bearer token required).
- `GET /api/events/joined` — list event IDs joined by the signed-in user (Bearer token required).
- Better Auth endpoints are available under `/api/auth/*`, including email/password and Google/GitHub OAuth.

Set a high-entropy `JWT_SECRET` of at least 32 characters. The API signs HS256 tokens with `iss` set to `BETTER_AUTH_URL`, `aud` set to `CLIENT_ORIGIN`, and a 15-minute expiry. The frontend keeps the access token in memory and refreshes it using the Better Auth session cookie; it sends the token in an Authorization header for protected API requests.
