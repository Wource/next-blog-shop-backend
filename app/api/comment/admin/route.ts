import { NextRequest } from "next/server";
import { prisma } from "@/lib/api/shared/infrastructure/prisma";
import CheckAuthentication from "@/lib/api/shared/services/CheckAuthentication";
import CheckAuthorization from "@/lib/api/shared/services/CheckAuthorization";
import { Response } from "@/lib/api/shared/types/response_schema/base";
import { ErrorResponse } from "@/lib/api/shared/services/ErrorResponse";
import {
  adminCommentListQuerySchema,
  AdminCommentListResponse,
} from "@/lib/api/comment/schema/admin-list";
import { CommentItem } from "@/lib/api/comment/schema/comment";
import { formatComment } from "@/lib/api/comment/formatComment";

// GET /api/comment/admin?status=pending|approved|rejected|all&page=1&limit=10 - Admin only
export async function GET(request: NextRequest) {
  try {
    const session = await CheckAuthentication();
    await CheckAuthorization(session, "Comment", "READ", "status");

    const { searchParams } = new URL(request.url);
    const { status, page, limit } =
      await adminCommentListQuerySchema.parseAsync({
        status: searchParams.get("status") ?? undefined,
        page: searchParams.get("page") ?? undefined,
        limit: searchParams.get("limit") ?? undefined,
      });
    const skip = (page - 1) * limit;

    const where = status === "all" ? {} : { status };

    const totalCount = await prisma.comment.count({ where });

    const comments = await prisma.comment.findMany({
      where,
      skip,
      take: limit,
      include: {
        user: {
          select: { id: true, name: true, image: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formattedComments: CommentItem[] = comments.map((c) =>
      formatComment(c),
    );

    return Response.ok<AdminCommentListResponse>({
      comments: formattedComments,
      pagination: {
        totalItems: totalCount,
        currentPage: page,
        itemsPerPage: limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    return ErrorResponse(error);
  }
}
