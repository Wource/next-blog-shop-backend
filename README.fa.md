# نکست‌شاپ — بک‌اند Headless بلاگ و فروشگاه

[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-7-2D3748)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-336791)](https://www.postgresql.org/)
[![Better Auth](https://img.shields.io/badge/Better_Auth-1.x-purple)](https://www.better-auth.com/)
[![MinIO](https://img.shields.io/badge/MinIO-S3_compatible-red)](https://min.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

> 🌐 [English](./README.md) | **فارسی**

یک بک‌اند Headless رایگان و متن‌باز برای **بلاگ + فروشگاه چندزبانه**، ساخته‌شده با **API Routes در Next.js 16 (App Router)**.

امکاناتی مثل پست‌های ترجمه‌پذیر، محصولات، برندها، دسته‌بندی‌ها، کامنت‌های رشته‌ای (threaded) و آپلود فایل روی S3 — همراه با احراز هویت، کنترل دسترسی نقش‌محور، اعتبارسنجی ورودی و ساختار یکدست پاسخ API.

> مخزن: `https://github.com/Wource/next-blog-shop-backend`

## ویژگی‌ها

- **محتوای چندزبانه** — مدل‌های `Blog` و `Product` و `BlogCategory` جدول ترجمه دارند و با `?lang=` کار می‌کنند (ترتیب fallback: `زبان درخواستی -> en -> اولین ترجمه موجود`)
- **بلاگ** — عملیات CRUD، اسلاگ، تصویر شاخص، وضعیت `pending | approved | rejected`، شمارش بازدید، دسته‌بندی
- **فروشگاه** — مدل `Product` (ترجمه، تصاویر، مشخصات فنی، ارزش غذایی)، مدل `Brand`
- **کامنت** — پاسخ‌های تودرتو (`parentId`)، لیست عمومی و لیست مدیریتی، ثبت پاسخ و تأیید/رد
- **مدیا / ذخیره‌سازی** — آپلود سازگار با S3 از طریق MinIO، لینک presigned، لیست و حذف فایل
- **احراز هویت + RBAC** — [Better Auth](https://www.better-auth.com/) (ایمیل + رمز عبور، پلاگین admin)، نقش در سشن، گارد `CheckAuthentication` و `CheckAuthorization` (نقش `admin` از همه بررسی‌ها عبور می‌کند)
- **اعتبارسنجی** — اسکیماهای [Zod](https://zod.dev/) برای هر دامنه
- **پاسخ یکدست** — کلاس `Response.ok / created / updated / badRequest / unauthorized / forbidden / notFound / serverError` با شکل `{ success, data, message, errorCode }`
- **صفحه‌بندی** — `?page=1&limit=10` (سقف ۱۰۰)
- **استک توسعه با داکر** — PostgreSQL 17 و MinIO با یک دستور

## تکنولوژی‌ها

| لایه          | انتخاب                                             |
| ------------- | -------------------------------------------------- |
| فریم‌ورک      | Next.js 16 (App Router)، React 19، TypeScript strict |
| ORM / دیتابیس | Prisma 7 (`@prisma/adapter-pg`)، PostgreSQL 17       |
| احراز هویت    | Better Auth + آداپتور Prisma + پلاگین admin          |
| ذخیره‌سازی   | MinIO (سازگار با S3) با AWS SDK v3                   |
| اعتبارسنجی   | Zod 4                                                |
| استایل        | Tailwind CSS 4 (فقط برای صفحات مدیریتی/لندینگ)        |
| لینت          | ESLint 9 (`eslint-config-next`)                      |

## شروع سریع

### پیش‌نیازها

- Node.js 20+
- Docker + Docker Compose
- npm

### ۱. کلون و نصب

```bash
git clone https://github.com/Wource/next-blog-shop-backend.git
cd next-blog-shop-backend
npm install
```

### ۲. تنظیم متغیرهای محیطی

```bash
cp env.example .env
```

فایل `.env` را ویرایش کنید — حداقل یک `BETTER_AUTH_SECRET` قوی بگذارید:

```bash
# ساخت مقدار تصادفی با:
openssl rand -base64 32
```

### ۳. اجرای زیرساخت

```bash
docker compose up minio postgres -d
```

| سرویس          | پورت | توضیح                          |
| -------------- | ---- | ------------------------------- |
| Postgres       | 5432 | داده‌ها در والیوم `postgres_data` |
| MinIO API      | 9000 | اندپوینت S3                      |
| MinIO Console  | 9001 | رابط وب، ورود با کلیدهای MinIO    |

### ۴. مایگریشن و سید

```bash
npx prisma migrate dev
npx tsx lib/api/shared/infrastructure/prisma/seed.ts
# یا: npx prisma db seed (اگر کانفیگ شده باشد)
```

اسکریپت سید با `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` / `SEED_ADMIN_NAME` یک کاربر ادمین می‌سازد و نقش `admin` می‌دهد.

### ۵. اجرای سرور توسعه

```bash
npm run dev
```

مرورگر: `http://localhost:3000` — بیس API همان `http://localhost:3000/api` است.

## متغیرهای محیطی

برای لیست کامل به [`env.example`](./env.example) و [`lib/config.ts`](./lib/config.ts) نگاه کنید.

| متغیر                | اجباری | مثال                                                 | توضیح                          |
| -------------------- | ------ | ---------------------------------------------------- | ------------------------------- |
| `DATABASE_URL`       | بله    | `postgresql://johndoe:randompassword@localhost:5432/mydb?schema=public` | اتصال Prisma و Better Auth |
| `BETTER_AUTH_SECRET` | بله    | خروجی `openssl rand -base64 32`                      | کلید امضای احراز هویت            |
| `BETTER_AUTH_URL`    | بله    | `http://localhost:3000`                              | آدرس عمومی اپ                   |
| `AUTH_TRUST_HOST`    | خیر    | `true`                                               | پشت پروکسی/داکر `true` بگذارید   |
| `POSTGRES_USER`      | بله    | `johndoe`                                            | استفاده در `docker-compose.yaml` |
| `POSTGRES_PASSWORD`  | بله    | `randompassword`                                     | استفاده در `docker-compose.yaml` |
| `POSTGRES_DB`        | بله    | `mydb`                                               | استفاده در `docker-compose.yaml` |
| `MINIO_ENDPOINT`     | بله    | `http://localhost:9000`                              | اندپوینت S3                     |
| `MINIO_ACCESS_KEY`   | بله    | `minioadmin`                                         | کلید دسترسی S3                  |
| `MINIO_SECRET_KEY`   | بله    | `minioadmin123`                                      | کلید مخفی S3                    |
| `MINIO_BUCKET_NAME`  | بله    | `next_blog_backend`                                  | باکت (هنگام آپلود ساخته می‌شود)  |
| `SEED_ADMIN_EMAIL`   | بله    | `admin@example.com`                                  | ایمیل ادمین سید                 |
| `SEED_ADMIN_PASSWORD`| بله    | `change-me-123`                                      | رمز ادمین سید                   |
| `SEED_ADMIN_NAME`    | بله    | `مدیر سایت`                                          | نام نمایشی ادمین                |

> فایل `.env` را هرگز کامیت نکنید. در [`.gitignore`](./.gitignore) نادیده گرفته شده است.

## نمای کلی API

بیس: `/api`. همه پاسخ‌های موفق این شکل‌اند:

```json
{
  "success": true,
  "data": {},
  "message": "Success"
}
```

پاسخ‌های خطا:

```json
{
  "success": false,
  "message": "Unauthorized",
  "errorCode": "UN_AUTHENTICATED"
}
```

پارامترهای رایج: `?page=1&limit=10` برای لیست‌ها، `?lang=fa` (یا `en` و...) برای منابع ترجمه‌پذیر.

| دامنه  | متد    | اندپوینت                              | دسترسی | توضیح                          |
| ------ | ------ | ------------------------------------- | ------ | ------------------------------- |
| بلاگ   | POST   | `/api/blog`                           | ادمین  | ساخت پست (+ ترجمه‌ها)           |
| بلاگ   | GET    | `/api/blog?page=1&limit=10&lang=fa`   | عمومی  | لیست صفحه‌بندی‌شده              |
| بلاگ   | GET    | `/api/blog/[id]?lang=fa`              | عمومی  | تک‌پست با fallback زبان         |
| بلاگ   | DELETE | `/api/blog/[id]`                      | ادمین  | حذف پست                         |
| دسته   | POST   | `/api/category`                       | ادمین  | ساخت دسته (+ ترجمه‌ها)          |
| دسته   | GET    | `/api/category?lang=fa`               | عمومی  | لیست دسته‌ها                    |
| دسته   | GET    | `/api/category/[id]?lang=fa`          | عمومی  | تک‌دسته همراه پست‌ها             |
| دسته   | DELETE | `/api/category/[id]`                  | ادمین  | حذف دسته                        |
| محصول  | POST   | `/api/product`                        | ادمین  | ساخت محصول (+ ترجمه‌ها)          |
| محصول  | GET    | `/api/product?page=1&limit=10&lang=fa`| عمومی  | لیست صفحه‌بندی‌شده              |
| محصول  | GET    | `/api/product/[id]?lang=fa`           | عمومی  | تک‌محصول                        |
| محصول  | DELETE | `/api/product/[id]`                   | ادمین  | حذف محصول                       |
| برند   | POST   | `/api/brand`                          | ادمین  | ساخت برند                       |
| برند   | GET    | `/api/brand`                          | عمومی  | لیست برندها                     |
| برند   | DELETE | `/api/brand/[id]`                     | ادمین  | حذف برند                        |
| کامنت  | GET    | `/api/comment?blogId=...`             | عمومی  | لیست کامنت‌های تأییدشده یک پست  |
| کامنت  | POST   | `/api/comment`                        | کاربر  | ثبت کامنت/پاسخ (`parentId?`)     |
| کامنت  | GET    | `/api/comment/[id]`                   | عمومی  | تک‌کامنت                        |
| کامنت  | PATCH  | `/api/comment/[id]`                   | مالک   | ویرایش کامنت خود                 |
| کامنت  | DELETE | `/api/comment/[id]`                   | مالک/ادمین | حذف کامنت                  |
| کامنت  | POST   | `/api/comment/[id]/respond`           | کاربر  | پاسخ به یک کامنت                |
| کامنت  | PATCH  | `/api/comment/[id]/status`            | ادمین  | تأیید / رد                      |
| کامنت  | GET    | `/api/comment/admin?page=1&limit=10`  | ادمین  | صف مدیریت                       |
| مدیا   | GET    | `/api/media`                          | کاربر  | لیست رکوردهای مدیا              |
| مدیا   | POST   | `/api/media`                          | کاربر  | ثبت آبجکت بعد از PUT در S3       |
| مدیا   | DELETE | `/api/media/[id]`                     | مالک   | حذف رکورد + آبجکت S3            |
| مدیا   | POST   | `/api/media/presigned`                | کاربر  | گرفتن لینک PUT مستقیم برای آپلود |

اندپوینت‌های احراز هویت را Better Auth می‌دهد (ایمیل/رمز + پلاگین admin). به [`lib/api/shared/infrastructure/auth.ts`](./lib/api/shared/infrastructure/auth.ts) نگاه کنید.

## ساختار پروژه

```
app/
  api/
    blog/route.ts            # POST و GET صفحه‌بندی‌شده
    blog/[id]/route.ts       # GET با fallback زبان، DELETE
    category/route.ts        # POST و GET
    category/[id]/route.ts   # GET همراه بلاگ‌ها، DELETE
    product/route.ts         # POST و GET
    product/[id]/route.ts    # GET و DELETE
    brand/route.ts           # POST و GET
    brand/[id]/route.ts      # DELETE
    comment/route.ts         # GET و POST
    comment/[id]/route.ts    # GET و PATCH و DELETE
    comment/[id]/respond/route.ts
    comment/[id]/status/route.ts
    comment/admin/route.ts   # لیست مدیریتی
    media/route.ts           # GET و POST
    media/[id]/route.ts      # DELETE
    media/presigned/route.ts # لینک PUT موقت
lib/
  config.ts                  # لودر تایپ‌شده متغیرهای محیطی
  api/
    shared/
      enums/ErrorCodes.ts
      infrastructure/
        auth.ts              # تنظیم Better Auth
        prisma.ts            # سینگلتون Prisma (آداپتور PrismaPg)
        s3.ts                # کلاینت S3 برای MinIO
        zod.ts               # اسکیماهای مشترک Zod
        prisma/
          schema/            # اسکیمای تکه‌تکه: schema/auth/blog/product/brand/comment/media/enums.prisma
          migrations/
          seed.ts            # سید ادمین
      services/
        CheckAuthentication.ts
        CheckAuthorization.ts
        ErrorResponse.ts     # نگاشت مرکزی خطا به Response
        gaurd.ts             # نقشه RBAC: نقش -> مدل -> اکشن‌ها
      types/
        errors.ts
        response_schema/base.ts
        response_schema/pagination.ts
    blog/category/product/brand/comment/media/storage/
      schema/...             # اسکیمای Zod و تایپ هر اکشن
prisma.config.ts             # کانفیگ اسکیما، مایگریشن و سید
docker-compose.yaml          # دیتابیس postgres:17-alpine و minio/minio
env.example
```

## نکته‌های معماری

- **کنترلرهای نازک:** فایل‌های `app/api/**/route.ts` فقط HTTP را مدیریت می‌کنند. منطق کسب‌وکار در `lib/api/` است.
- **پاسخ‌ها:** همیشه از کلاس `Response` در `lib/api/shared/types/response_schema/base.ts` استفاده کنید، نه `NextResponse.json()` خام.
- **خطاها:** هندلرها را در `try/catch` بگذارید، با `CheckAuthentication` و `CheckAuthorization` خطای `UnAuthenticatedError / UnAuthorizedError` پرتاب کنید و در `catch` به `ErrorResponse(error)` بدهید تا `ZodError` و خطاهای احراز هویت و سرور با `APIErrorCodes` نگاشت شوند.
- **RBAC:** متد `Gaurd.can(role, model, action, field?)` در `lib/api/shared/services/gaurd.ts`. نقش `admin` از همه‌چیز عبور می‌کند. برای باز کردن مدل‌ها `guardMap.user` را توسعه بدهید.
- **چندزبانگی:** جدول‌های ترجمه (`BlogTranslation` و `ProductTranslation` و `BlogCategoryTranslation`). پارامتر `?lang=fa` بدهید؛ fallback هم `زبان درخواستی -> en -> اولی` است.
- **آپلود:** کلاینت اول `POST /api/media/presigned` می‌زند، فایل را مستقیم با `PUT` روی S3/MinIO می‌گذارد، بعد با `POST /api/media` ثبت می‌کند. به `lib/api/storage/storage.ts` نگاه کنید.
- **قراردادها:** آلیاس `@/*` به ریشه ریپو، `server only` در ماژول‌های سرور، `params: Promise<{ id: string }>` در روت‌های داینامیک Next.js 16، و `slugify` برای اسلاگ.

## اسکریپت‌ها

| دستور                    | توضیح                  |
| ------------------------ | ----------------------- |
| `npm run dev`            | اجرای سرور توسعه        |
| `npm run build`          | بیلد پروداکشن           |
| `npm run start`          | اجرای سرور پروداکشن     |
| `npm run lint`           | اجرای ESLint            |
| `npx prisma migrate dev` | ساخت/اعمال مایگریشن دیتابیس |
| `npx prisma studio`      | مرورگر تصویری دیتابیس   |

## مشارکت

ایشو و پول‌ریکوئست آزاد است. این پروژه برای استفاده آزاد است — اگر به کارتان آمد، یک ستاره بدهید.

1. ریپو را فورک کنید
2. برنچ ویژگی بسازید: `git checkout -b feat/my-change`
3. قبل از پوش، لینت و بیلد را اجرا کنید: `npm run lint && npm run build`
4. PR با توضیح شفاف باز کنید

## لایسنس

[MIT](./LICENSE) ‏© 2026 Wource — آزاد برای استفاده شخصی و تجاری، تغییر و توزیع.
