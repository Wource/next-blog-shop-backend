import { NextRequest } from "next/server";
import { prisma } from "@/lib/api/shared/infrastructure/prisma";
import CheckAuthentication from "@/lib/api/shared/services/CheckAuthentication";
import CheckAuthorization from "@/lib/api/shared/services/CheckAuthorization";
import { Response } from "@/lib/api/shared/types/response_schema/base";
import { ErrorResponse } from "@/lib/api/shared/services/ErrorResponse";
import { APIErrorCodes } from "@/lib/api/shared/enums/ErrorCodes";
import {
  commentCreateZodSchema,
  CommentCreateResponse,
} from "@/lib/api/comment/schema/create";
import { CommentListResponse } from "@/lib/api/comment/schema/list";
import { PublicCommentItem } from "@/lib/api/comment/schema/comment";
import { formatComment, formatPublicComment } from "@/lib/api/comment/formatComment";

// GET /api/comment?blogId=...&page=1&limit=10
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const blogId = searchParams.get("blogId");

    if (!blogId) {
      return Response.badRequest(
        "blogId is required",
        APIErrorCodes.validation.REQUIRED_FIELD,
      );
    }

    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") || "10")),
    );
    const skip = (page - 1) * limit;

    const totalCount = await prisma.comment.count({
      where: { blogId, parentId: null, status: "approved" },
    });

    const comments = await prisma.comment.findMany({
      where: { blogId, parentId: null, status: "approved" },
      skip,
      take: limit,
      include: {
        user: {
          select: { id: true, name: true, image: true },
        },
        responses: {
          where: { status: "approved" },
          include: {
            user: {
              select: { id: true, name: true, image: true },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formattedComments: PublicCommentItem[] = comments.map((c) => ({
      ...formatPublicComment(c),
      responses: c.responses.map((r) => ({
        ...formatPublicComment(r),
        responses: [],
      })),
    }));

    return Response.ok<CommentListResponse>({
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

// POST /api/comment
export async function POST(request: NextRequest) {
  try {
    const session = await CheckAuthentication();
    CheckAuthorization(session, "Comment", "CREATE");

    const body = await request.json();
    const { content, blogId } = await commentCreateZodSchema.parseAsync(body);

    // Check blog exists
    const blog = await prisma.blog.findUnique({ where: { id: blogId } });
    if (!blog) {
      return Response.notFound(
        "Blog not found",
        APIErrorCodes.notFound.POST_NOT_FOUND,
      );
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        blogId,
        userId: session.user.id,
      },
      include: {
        user: {
          select: { id: true, name: true, image: true },
        },
      },
    });

    return Response.created<CommentCreateResponse>(formatComment(comment));
  } catch (error) {
    return ErrorResponse(error);
  }
}
