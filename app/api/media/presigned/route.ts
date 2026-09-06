import { NextRequest } from "next/server";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3 } from "@/lib/api/shared/infrastructure/s3";
import CheckAuthentication from "@/lib/api/shared/services/CheckAuthentication";
import CheckAuthorization from "@/lib/api/shared/services/CheckAuthorization";
import {
  buildMediaObjectKey,
  buildMediaPublicUrl,
  createPutObjectCommand,
  generateMediaSlug,
  getMediaContentType,
} from "@/lib/api/storage/storage";
import { ErrorResponse } from "@/lib/api/shared/services/ErrorResponse";
import { Response } from "@/lib/api/shared/types/response_schema/base";
import { APIErrorCodes } from "@/lib/api/shared/enums/ErrorCodes";
import {
  presignedUploadZodSchema,
  PresignedUploadResponse,
} from "@/lib/api/media/schema/presigned/schema";

const PRESIGNED_EXPIRES_IN_SECONDS = 60 * 10;

export async function POST(req: NextRequest) {
  try {
    const session = await CheckAuthentication();
    await CheckAuthorization(session, "Media", "CREATE");

    const body = await req.json();
    const { title, fileName, type } =
      await presignedUploadZodSchema.parseAsync(body);

    const extension = (fileName.split(".").pop() || "").toLowerCase();
    if (!extension) {
      return Response.badRequest(
        "The file extension could not be detected.",
        APIErrorCodes.validation.INVALID_INPUT,
      );
    }

    const slug = generateMediaSlug(title);
    const contentType = getMediaContentType(type, extension);

    const objectKey = buildMediaObjectKey(type, slug, extension);
    const path = buildMediaPublicUrl(objectKey);
    const command = createPutObjectCommand({ objectKey, contentType });
    const uploadUrl = await getSignedUrl(s3, command, {
      expiresIn: PRESIGNED_EXPIRES_IN_SECONDS,
    });

    return Response.ok<PresignedUploadResponse>({
      uploadUrl,
      objectKey,
      path,
      contentType,
      slug,
      expiresIn: PRESIGNED_EXPIRES_IN_SECONDS,
    });
  } catch (error) {
    return ErrorResponse(error);
  }
}
