import { NextRequest } from "next/server";
import { prisma } from "@/lib/api/shared/infrastructure/prisma";
import CheckAuthentication from "@/lib/api/shared/services/CheckAuthentication";
import CheckAuthorization from "@/lib/api/shared/services/CheckAuthorization";
import { Response } from "@/lib/api/shared/types/response_schema/base";
import { ErrorResponse } from "@/lib/api/shared/services/ErrorResponse";
import { APIErrorCodes } from "@/lib/api/shared/enums/ErrorCodes";
import {
  mediaFinalizeZodSchema,
  MediaFinalizeResponse,
} from "@/lib/api/media/schema/create/schema";
import {
  mediaListQuerySchema,
  MediaListResponse,
} from "@/lib/api/media/schema/list/schema";
import { Media } from "@/lib/api/media/schema/schema";
import { Role } from "@/lib/api/shared/infrastructure/prisma/generated/enums";

// GET /api/media?type=image&search=&page=1&limit=10
export async function GET(request: NextRequest) {
  try {
    const session = await CheckAuthentication();
    await CheckAuthorization(session, "Media", "READ");

    const { searchParams } = new URL(request.url);
    const { type, search, page, limit } =
      await mediaListQuerySchema.parseAsync({
        type: searchParams.get("type") ?? undefined,
        search: searchParams.get("search") ?? undefined,
        page: searchParams.get("page") ?? undefined,
        limit: searchParams.get("limit") ?? undefined,
      });
    const skip = (page - 1) * limit;

    const isAdmin = (session.user as { role: Role }).role === "admin";
    const where = {
      ...(isAdmin ? {} : { createdById: session.user.id }),
      ...(type ? { type } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" as const } },
              { alt: { contains: search, mode: "insensitive" as const } },
              { slug: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const totalCount = await prisma.media.count({ where });
    const rows = await prisma.media.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    });

    const media: Media[] = rows.map((m) => ({
      id: m.id,
      title: m.title,
      slug: m.slug,
      alt: m.alt,
      type: m.type,
      objectKey: m.objectKey,
      url: m.url,
      mimeType: m.mimeType,
      sizeBytes: m.sizeBytes,
      createdById: m.createdById,
      createdAt: m.createdAt.toISOString(),
      updatedAt: m.updatedAt.toISOString(),
    }));

    return Response.ok<MediaListResponse>({
      media,
      pagination: {
        totalItems: totalCount,
        currentPage: page,
        itemsPerPage: limit,
        totalPages: Math.max(1, Math.ceil(totalCount / limit)),
      },
    });
  } catch (error) {
    return ErrorResponse(error);
  }
}

// POST /api/media — finalize after client PUTs file to presigned uploadUrl
export async function POST(request: NextRequest) {
  try {
    const session = await CheckAuthentication();
    await CheckAuthorization(session, "Media", "CREATE");

    const body = await request.json();
    const { title, slug, alt, type, fileName, objectKey, path, mimeType, sizeBytes } =
      await mediaFinalizeZodSchema.parseAsync(body);

    if (!path.includes(objectKey)) {
      return Response.badRequest(
        "Path and object key do not match.",
        APIErrorCodes.validation.INVALID_INPUT,
      );
    }

    const extension = (fileName.split(".").pop() || "").toLowerCase();
    if (!extension) {
      return Response.badRequest(
        "The file extension could not be detected.",
        APIErrorCodes.validation.INVALID_INPUT,
      );
    }

    const slugExists = await prisma.media.findUnique({ where: { slug } });
    if (slugExists) {
      return Response.conflict(
        "A media with this slug already exists",
        APIErrorCodes.conflict.SLUG_ALREADY_EXISTS,
      );
    }

    const keyExists = await prisma.media.findUnique({ where: { objectKey } });
    if (keyExists) {
      return Response.conflict(
        "A media with this object key already exists",
        APIErrorCodes.conflict.DUPLICATE_ENTRY,
      );
    }

    await prisma.media.create({
      data: {
        title,
        slug,
        alt,
        type,
        objectKey,
        url: path,
        mimeType,
        sizeBytes,
        createdById: session.user.id,
      },
    });

    return Response.created<MediaFinalizeResponse>({});
  } catch (error) {
    return ErrorResponse(error);
  }
}
