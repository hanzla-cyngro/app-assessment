# NestJS API

This application owns authentication verification, incident CRUD and business rules, MongoDB/Mongoose persistence, analytics, attachment metadata, signed Supabase Storage URLs, and trusted realtime notifications.

## Run locally

```bash
cp .env.example .env
# Fill the values in .env; never commit this file.
npm install
npm run start:dev
```

The API listens on `http://localhost:3001` by default. `GET /health` is public. Every `/incidents` endpoint requires `Authorization: Bearer <Supabase access token>`.

Swagger UI is available at `http://localhost:3001/docs`, with the OpenAPI JSON at `http://localhost:3001/docs-json`. Use the **Authorize** button and enter a Supabase access token to try the protected incident routes.

## Checks

```bash
npm run build
npm run typecheck
npm test
npm run test:e2e
```

See the repository root README for architecture, environment variables, API routes, storage configuration, and Supabase Realtime policy setup.
