# NexShop — Headless Blog & Shop Backend

> 🌐 **English** | [فارسی](./README.fa.md)

[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-7-2D3748)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-336791)](https://www.postgresql.org/)
[![Better Auth](https://img.shields.io/badge/Better_Auth-1.x-purple)](https://www.better-auth.com/)
[![MinIO](https://img.shields.io/badge/MinIO-S3_compatible-red)](https://min.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

A free and open-source headless backend for a multi-language **blog + shop**, built with **Next.js 16 App Router API routes**.

It gives you blog posts with translations, products, brands, categories, threaded comments, and S3 media uploads — with authentication, role-based authorization, validation, and a consistent API response shape out of the box.

> Repository: `https://github.com/Wource/next-blog-shop-backend`

## Features

- **Multi-language content** — `Blog`, `Product`, and `BlogCategory` use translation tables with `?lang=` fallback (`preferred -> en -> first available`)
- **Blog** — CRUD, slug, thumbnail, `pending | approved | rejected` status, view count, categories
- **Shop basics** — `Product` (translations, images, specifications, nutritional value), `Brand`
- **Comments** — threaded replies (`parentId`), user + admin list, respond and approve/reject flow
- **Media / storage** — S3-compatible uploads via MinIO, presigned URLs, list + delete
- **Auth + RBAC** — [Better Auth](https://www.better-auth.com/) (email + password, admin plugin), session roles, `CheckAuthentication` / `CheckAuthorization` guard (`admin` bypasses all checks)
- **Validation** — [Zod](https://zod.dev/) schemas per domain
- **Consistent responses** — `Response.ok / created / updated / badRequest / unauthorized / forbidden / notFound / serverError` with `{ success, data, message, errorCode }`
- **Pagination** — `?page=1&limit=10` (max 100)
- **Docker dev stack** — PostgreSQL 17 + MinIO with one command

## Tech Stack

| Layer      | Choice                                              |
| ---------- | --------------------------------------------------- |
| Framework  | Next.js 16 (App Router), React 19, TypeScript strict |
| ORM / DB   | Prisma 7 (`@prisma/adapter-pg`), PostgreSQL 17       |
| Auth       | Better Auth + Prisma adapter + admin plugin          |
| Storage    | MinIO (S3-compatible) via AWS SDK v3                |
| Validation | Zod 4                                                 |
| Styling    | Tailwind CSS 4 (admin / landing pages only)           |
| Lint       | ESLint 9 (`eslint-config-next`)                       |

## Quickstart

### Prerequisites

- Node.js 20+
- Docker + Docker Compose
- npm

### 1. Clone and install

```bash
git clone https://github.com/Wource/next-blog-shop-backend.git
cd next-blog-shop-backend
npm install
```

### 2. Configure environment

```bash
cp env.example .env
```

Edit `.env` — at minimum set a strong `BETTER_AUTH_SECRET`:

```bash
# generate one with:
openssl rand -base64 32
```

### 3. Start infrastructure

```bash
docker compose up minio postgres -d
```

| Service  | Port | Notes                        |
| -------- | ---- | ---------------------------- |
| Postgres | 5432 | data in `postgres_data` volume |
| MinIO API | 9000 | S3 endpoint                  |
| MinIO Console | 9001 | web UI, login with MinIO keys |

### 4. Migrate and seed

```bash
npx prisma migrate dev
npx tsx lib/api/shared/infrastructure/prisma/seed.ts
# or: npx prisma db seed (if configured)
```

The seed creates an admin user from `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` / `SEED_ADMIN_NAME` and assigns `role = admin`.

### 5. Run the dev server

```bash
npm run dev
```

Open `http://localhost:3000`. API base is `http://localhost:3000/api`.

## Environment Variables

See [`env.example`](./env.example). Full list in [`lib/config.ts`](./lib/config.ts).

| Variable              | Required | Example                                              | Description                          |
| --------------------- | -------- | ---------------------------------------------------- | ------------------------------------ |
| `DATABASE_URL`        | yes      | `postgresql://johndoe:randompassword@localhost:5432/mydb?schema=public` | Prisma / Better Auth connection |
| `BETTER_AUTH_SECRET`  | yes      | `openssl rand -base64 32`                            | Auth signing secret                  |
| `BETTER_AUTH_URL`     | yes      | `http://localhost:3000`                              | Public app URL                       |
| `AUTH_TRUST_HOST`     | no       | `true`                                               | Set `true` behind proxies / Docker   |
| `POSTGRES_USER`       | yes      | `johndoe`                                            | Used by `docker-compose.yaml`        |
| `POSTGRES_PASSWORD`   | yes      | `randompassword`                                     | Used by `docker-compose.yaml`        |
| `POSTGRES_DB`         | yes      | `mydb`                                               | Used by `docker-compose.yaml`        |
| `MINIO_ENDPOINT`      | yes      | `http://localhost:9000`                              | S3 endpoint                          |
| `MINIO_ACCESS_KEY`    | yes      | `minioadmin`                                         | S3 access key                        |
| `MINIO_SECRET_KEY`    | yes      | `minioadmin123`                                      | S3 secret key                        |
| `MINIO_BUCKET_NAME`   | yes      | `next_blog_backend`                                  | Bucket (auto-created on upload)      |
| `SEED_ADMIN_EMAIL`    | yes      | `admin@example.com`                                  | Seed admin email                     |
| `SEED_ADMIN_PASSWORD` | yes      | `change-me-123`                                      | Seed admin password                  |
| `SEED_ADMIN_NAME`     | yes      | `Site Admin`                                         | Seed admin display name              |

> Never commit `.env`. It is already ignored in [`.gitignore`](./.gitignore).

## API Overview

Base URL: `/api`. All success responses look like:

```json
{
  "success": true,
  "data": {},
  "message": "Success"
}
```

Errors look like:

```json
{
  "success": false,
  "message": "Unauthorized",
  "errorCode": "UN_AUTHENTICATED"
}
```

Common query params: `?page=1&limit=10` for lists, `?lang=en` (or `fa`, etc.) for translated resources.

| Domain   | Method | Endpoint                          | Auth | Description                              |
| -------- | ------ | --------------------------------- | ---- | ---------------------------------------- |
| Blog     | POST   | `/api/blog`                       | admin | Create post (+ translations)            |
| Blog     | GET    | `/api/blog?page=1&limit=10&lang=en` | public | Paginated list                        |
| Blog     | GET    | `/api/blog/[id]?lang=en`          | public | Single post with lang fallback         |
| Blog     | DELETE | `/api/blog/[id]`                  | admin | Delete post                             |
| Category | POST   | `/api/category`                   | admin | Create category (+ translations)        |
| Category | GET    | `/api/category?lang=en`           | public | List categories                       |
| Category | GET    | `/api/category/[id]?lang=en`      | public | Single category with blogs            |
| Category | DELETE | `/api/category/[id]`              | admin | Delete category                        |
| Product  | POST   | `/api/product`                    | admin | Create product (+ translations)         |
| Product  | GET    | `/api/product?page=1&limit=10&lang=en` | public | Paginated list                     |
| Product  | GET    | `/api/product/[id]?lang=en`       | public | Single product                        |
| Product  | DELETE | `/api/product/[id]`               | admin | Delete product                          |
| Brand    | POST   | `/api/brand`                      | admin | Create brand                            |
| Brand    | GET    | `/api/brand`                      | public | List brands                           |
| Brand    | DELETE | `/api/brand/[id]`                 | admin | Delete brand                           |
| Comment  | GET    | `/api/comment?blogId=...`         | public | List approved comments for a post    |
| Comment  | POST   | `/api/comment`                    | user | Create comment / reply (`parentId?`)     |
| Comment  | GET    | `/api/comment/[id]`               | public | Single comment                        |
| Comment  | PATCH  | `/api/comment/[id]`               | owner | Edit own comment                       |
| Comment  | DELETE | `/api/comment/[id]`               | owner/admin | Delete comment                 |
| Comment  | POST   | `/api/comment/[id]/respond`       | user | Reply to a comment                      |
| Comment  | PATCH  | `/api/comment/[id]/status`        | admin | Approve / reject                        |
| Comment  | GET    | `/api/comment/admin?page=1&limit=10` | admin | Moderation queue                     |
| Media    | GET    | `/api/media`                      | user | List media records                      |
| Media    | POST   | `/api/media`                      | user | Register uploaded object after S3 PUT    |
| Media    | DELETE | `/api/media/[id]`                 | owner | Delete record + S3 object              |
| Media    | POST   | `/api/media/presigned`            | user | Get presigned PUT URL for direct upload |

Auth endpoints are served by Better Auth (email/password + admin plugin). See [`lib/api/shared/infrastructure/auth.ts`](./lib/api/shared/infrastructure/auth.ts).

## Project Structure

```
app/
  api/
    blog/route.ts            # POST, GET (paginated)
    blog/[id]/route.ts       # GET (lang fallback), DELETE
    category/route.ts        # POST, GET
    category/[id]/route.ts   # GET (with blogs), DELETE
    product/route.ts         # POST, GET
    product/[id]/route.ts    # GET, DELETE
    brand/route.ts           # POST, GET
    brand/[id]/route.ts      # DELETE
    comment/route.ts         # GET, POST
    comment/[id]/route.ts    # GET, PATCH, DELETE
    comment/[id]/respond/route.ts
    comment/[id]/status/route.ts
    comment/admin/route.ts   # moderation list
    media/route.ts           # GET, POST
    media/[id]/route.ts      # DELETE
    media/presigned/route.ts # presigned PUT URLs
lib/
  config.ts                  # typed env loader
  api/
    shared/
      enums/ErrorCodes.ts
      infrastructure/
        auth.ts              # Better Auth setup
        prisma.ts            # Prisma singleton (PrismaPg adapter)
        s3.ts                # S3Client (MinIO, path-style)
        zod.ts               # shared Zod schemas
        prisma/
          schema/            # split schema: schema/auth/blog/product/brand/comment/media/enums.prisma
          migrations/
          seed.ts            # admin seed
      services/
        CheckAuthentication.ts
        CheckAuthorization.ts
        ErrorResponse.ts     # central error -> Response mapper
        gaurd.ts             # RBAC map: role -> model -> actions
      types/
        errors.ts
        response_schema/base.ts
        response_schema/pagination.ts
    blog/category/product/brand/comment/media/storage/
      schema/...             # per-action Zod + TS types
prisma.config.ts             # schema + migrations + seed config
docker-compose.yaml          # postgres:17-alpine + minio/minio
env.example
```

## Architecture Notes

- **Thin controllers:** `app/api/**/route.ts` only handles HTTP. Business logic lives in `lib/api/`.
- **Responses:** always use the `Response` class from `lib/api/shared/types/response_schema/base.ts` instead of raw `NextResponse.json()`.
- **Errors:** wrap handlers in `try/catch`, `throw UnAuthenticatedError / UnAuthorizedError` from `CheckAuthentication` / `CheckAuthorization`, let `ErrorResponse(error)` map `ZodError` / auth / server errors with `APIErrorCodes`.
- **RBAC:** `Gaurd.can(role, model, action, field?)` in `lib/api/shared/services/gaurd.ts`. `admin` bypasses everything. Extend `guardMap.user` to open up models.
- **i18n:** translation tables (`BlogTranslation`, `ProductTranslation`, `BlogCategoryTranslation`). Pass `?lang=fa`; fallback is `preferred -> en -> first`.
- **Uploads:** client calls `POST /api/media/presigned` -> `PUT` file directly to S3/MinIO -> `POST /api/media` to register. See `lib/api/storage/storage.ts`.
- **Conventions:** `@/*` alias to repo root, `server only` in server modules, async `params: Promise<{ id: string }>` in Next.js 16 dynamic routes, `slugify` for slugs.

## Scripts

| Command          | Description                              |
| ---------------- | ---------------------------------------- |
| `npm run dev`    | Start dev server                         |
| `npm run build`  | Production build                         |
| `npm run start`  | Start production server                  |
| `npm run lint`   | Run ESLint                               |
| `npx prisma migrate dev` | Create/apply DB migration        |
| `npx prisma studio` | Visual DB browser                     |

## Contributing

Issues and pull requests are welcome. This project is free to use — if it helps you, a star is appreciated.

1. Fork the repo
2. Create a feature branch: `git checkout -b feat/my-change`
3. Run lint + build before pushing: `npm run lint && npm run build`
4. Open a PR with a clear description

## License

[MIT](./LICENSE) © 2026 Wource. Free for personal and commercial use, modification, and distribution.
