import { NextRequest } from "next/server";
import { prisma } from "@/lib/api/shared/infrastructure/prisma";
import CheckAuthentication from "@/lib/api/shared/services/CheckAuthentication";
import CheckAuthorization from "@/lib/api/shared/services/CheckAuthorization";
import { Response } from "@/lib/api/shared/types/response_schema/base";
import { ErrorResponse } from "@/lib/api/shared/services/ErrorResponse";
import { APIErrorCodes } from "@/lib/api/shared/enums/ErrorCodes";
import { deleteMediaObjectByPath } from "@/lib/api/storage/storage";
import { Role } from "@/lib/api/shared/infrastructure/prisma/generated/enums";

// DELETE /api/media/:id — deletes from object storage and database
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await CheckAuthentication();
    await CheckAuthorization(session, "Media", "DELETE");

    const { id } = await params;
    const isAdmin = (session.user as { role: Role }).role === "admin";

    const media = await prisma.media.findFirst({
      where: {
        id,
        ...(isAdmin ? {} : { createdById: session.user.id }),
      },
    });

    if (!media) {
      return Response.notFound(
        "Media not found",
        APIErrorCodes.notFound.MEDIA_NOT_FOUND,
      );
    }

    await deleteMediaObjectByPath(media.objectKey);
    await prisma.media.delete({ where: { id: media.id } });

    return Response.ok({}, "Media deleted successfully");
  } catch (error) {
    return ErrorResponse(error);
  }
}
