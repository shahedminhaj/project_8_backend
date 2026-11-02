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
- `GET /api/events` and `GET /api/events/:id` — public event listings and details.
- `POST /api/events` — create an event (signed-in users).
- `PATCH /api/events/:id` and `DELETE /api/events/:id` — update or delete your own event.
- `POST /api/events/:id/join` — join an event (signed-in users).
- `DELETE /api/events/:id/join` — leave an event (signed-in users).
- `GET /api/events/joined` — list event IDs joined by the signed-in user.
- Better Auth endpoints are available under `/api/auth/*`, including email/password and Google/GitHub OAuth.

The frontend must send requests with cookies enabled; its API client does this automatically.
