# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js App Router, React, and TypeScript frontend with feature-based modules; FastAPI, SQLModel, PostgreSQL, and Docker Compose backend/deployment.

## Users

Administrators and sales staff are equally important users. Sales staff review and progress customer applications. Administrators also manage employees, residential complexes, apartments, and prices.

## Product Purpose

Construction CRM keeps a construction company's apartment inventory and sales applications in one staff-facing system. Staff review applications and move them through permitted stages; admins manage the catalog, pricing, employees, and audit history. A confirmed sale marks its viewing-stage lead as won and the apartment as sold in one transaction.

## Positioning

No distinctive market position or comparative claim has been established.

## Operating Context

Staff use the product in a web browser. Access is authenticated with role-based permissions and company-scoped records.

## Capabilities and Constraints

- The confirmed interface language is Uzbek in Latin script.
- Use a glassmorphic visual system as a product material: translucent panels and blur only where they improve layering and hierarchy, with readable contrast and solid-color fallbacks.
- Lead stages are `new`, `contacted`, `viewing`, `won`, and `lost`; ordinary stage changes require an expected record version. A dedicated sale-confirm operation may move a viewing lead to `won` and its apartment to `sold` atomically.
- Sales staff can read and update leads; viewers can read leads; administrators can manage staff, catalog, prices, and audit records.
- Sign-in is username/password only; initial administrator creation is provided by the backend bootstrap command.
- Test-only Uzbek sample records are synthetic and must only be seeded into an explicitly configured isolated test database.

## Brand Commitments

No official company logo has been supplied. Use glassmorphism without inventing a company identity, and keep Uzbek Latin as the interface language.

## Evidence on Hand

Backend source of truth: `backend/app/main.py`, `backend/app/modules/auth/routes.py`, `backend/app/modules/leads/routes.py`, `backend/app/modules/catalog/routes.py`, `backend/app/modules/inventory/routes.py`, and `backend/app/schemas.py`. No testimonials, customer logos, or marketing claims were supplied.

## Product Principles

- Keep sales and administration useful to their respective roles.
- Show only actions that the current role and API support.
- Preserve clear application status and current inventory values.
- Do not fabricate customer, sales, or performance data.
