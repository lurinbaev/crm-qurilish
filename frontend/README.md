# Frontend

Next.js App Router frontend. Route segments live in `src/app`; business areas are isolated under `src/features/{auth,leads,catalog,users,audit,public-catalog}`; API contracts/client are in `src/lib/api`; reusable UI and providers are in `src/components`.

Run `pnpm install --frozen-lockfile`, then `pnpm dev`. In Docker, `BACKEND_ORIGIN` points at the API service and the Next rewrite keeps browser requests on `/api/v1` same-origin. Production uses the standalone output and the `frontend/Dockerfile` multi-stage image.

`NEXT_PUBLIC_COMPANY_SLUG` selects the public catalog company. CRM paths require role permissions from the API; client-side visibility is only a usability layer and the backend remains authoritative.
