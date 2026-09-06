import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { MediaTypes } from "@/lib/api/shared/infrastructure/prisma/generated/client";
import slugify from "slugify";
import { s3 } from "@/lib/api/shared/infrastructure/s3";

const S3_BUCKET = process.env.MINIO_BUCKET_NAME;
const S3_ENDPOINT = process.env.MINIO_ENDPOINT;

export const MEDIA_TYPE_VALUES: MediaTypes[] = ["image", "thumbnail"];

export function ensureS3Config() {
  if (!S3_BUCKET || !S3_ENDPOINT) {
    throw new Error(
      "Missing MinIO S3 env vars. Required: MINIO_ENDPOINT, MINIO_BUCKET_NAME.",
    );
  }
}

export function generateMediaSlug(title: string): string {
  return slugify(title, { lower: true, strict: true });
}

export function normalizeExt(ext: string) {
  return ext.startsWith(".") ? ext : `.${ext}`;
}

export function getMediaContentType(type: MediaTypes, extension: string) {
  const ext = extension.toLowerCase();
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "png") return "image/png";
  if (ext === "gif") return "image/gif";
  if (ext === "webp") return "image/webp";
  if (ext === "svg") return "image/svg+xml";
  return "application/octet-stream";
}

export function buildMediaObjectKey(
  type: MediaTypes,
  slug: string,
  extension: string,
) {
  return `public/${type}/${slug}${normalizeExt(extension)}`;
}

export function buildMediaPublicUrl(objectKey: string) {
  ensureS3Config();
  const endpoint = S3_ENDPOINT!.replace(/\/+$/, "");
  const key = objectKey.replace(/^\/+/, "");
  return `${endpoint}/${key}`;
}

export function getObjectKeyFromMediaPath(pathOrUrl: string) {
  if (!pathOrUrl) return undefined;

  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
    try {
      const parsed = new URL(pathOrUrl);
      const pathname = parsed.pathname.replace(/^\/+/, "");
      const maybeWithoutBucket = S3_BUCKET
        ? pathname.replace(new RegExp(`^${S3_BUCKET}/`), "")
        : pathname;
      return maybeWithoutBucket || undefined;
    } catch {
      return undefined;
    }
  }

  const maybeKey = pathOrUrl.replace(/^\/+/, "");
  return maybeKey || undefined;
}

export function createPutObjectCommand(args: {
  objectKey: string;
  contentType: string;
}) {
  ensureS3Config();
  return new PutObjectCommand({
    Bucket: S3_BUCKET!,
    Key: args.objectKey,
    ContentType: args.contentType,
  });
}

export async function deleteMediaObjectByPath(pathOrUrl: string) {
  ensureS3Config();
  const objectKey = getObjectKeyFromMediaPath(pathOrUrl);
  if (!objectKey) return;

  await s3.send(
    new DeleteObjectCommand({
      Bucket: S3_BUCKET!,
      Key: objectKey,
    }),
  );
}
