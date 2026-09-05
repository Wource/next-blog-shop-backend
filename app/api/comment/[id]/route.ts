import { NextRequest } from "next/server";
import { prisma } from "@/lib/api/shared/infrastructure/prisma";
import CheckAuthentication from "@/lib/api/shared/services/CheckAuthentication";
import CheckAuthorization from "@/lib/api/shared/services/CheckAuthorization";
import { Response } from "@/lib/api/shared/types/response_schema/base";
import { ErrorResponse } from "@/lib/api/shared/services/ErrorResponse";
import { APIErrorCodes } from "@/lib/api/shared/enums/ErrorCodes";
import {
  commentUpdateZodSchema,
  CommentUpdateResponse,
} from "@/lib/api/comment/schema/update";
import { CommentDeleteResponse } from "@/lib/api/comment/schema/delete";
import { CommentGetResponse } from "@/lib/api/comment/schema/get";
import { PublicCommentItem } from "@/lib/api/comment/schema/comment";
import { formatComment, formatPublicComment } from "@/lib/api/comment/formatComment";

// GET /api/comment/[id]
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const id = (await params).id;

    if (!id) {
      return Response.badRequest(
        "Invalid comment ID",
        APIErrorCodes.validation.INVALID_INPUT,
      );
    }

    let isAdmin = false;
    try {
      const session = await CheckAuthentication();
      isAdmin = session.user.role === "admin";
    } catch {
      isAdmin = false;
    }

    const comment = await prisma.comment.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, image: true },
        },
        responses: {
          where: isAdmin ? {} : { status: "approved" },
          include: {
            user: {
              select: { id: true, name: true, image: true },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!comment) {
      return Response.notFound(
        "Comment not found",
        APIErrorCodes.notFound.COMMENT_NOT_FOUND,
      );
    }

    // Public sees approved only; admins can preview pending/rejected
    if (comment.status !== "approved" && !isAdmin) {
      return Response.notFound(
        "Comment not found",
        APIErrorCodes.notFound.COMMENT_NOT_FOUND,
      );
    }

    const formattedComment: PublicCommentItem = {
      ...formatPublicComment(comment),
      responses: comment.responses.map((r) => ({
        ...formatPublicComment(r),
        responses: [],
      })),
    };

    return Response.ok<CommentGetResponse>(formattedComment);
  } catch (error) {
    return ErrorResponse(error);
  }
}

// PATCH /api/comment/[id] - Update content (owner only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await CheckAuthentication();

    const id = (await params).id;
    if (!id) {
      return Response.badRequest(
        "Invalid comment ID",
        APIErrorCodes.validation.INVALID_INPUT,
      );
    }

    const existingComment = await prisma.comment.findUnique({
      where: { id },
    });

    if (!existingComment) {
      return Response.notFound(
        "Comment not found",
        APIErrorCodes.notFound.COMMENT_NOT_FOUND,
      );
    }

    // Only the owner can update content
    if (existingComment.userId !== session.user.id) {
      return Response.forbidden(
        "You can only update your own comments",
        APIErrorCodes.authorization.FORBIDDEN,
      );
    }

    const body = await request.json();
    const { content } = await commentUpdateZodSchema.parseAsync(body);

    const updatedComment = await prisma.comment.update({
      where: { id },
      data: { content },
      include: {
        user: {
          select: { id: true, name: true, image: true },
        },
      },
    });

    return Response.updated<CommentUpdateResponse>(
      formatComment(updatedComment),
    );
  } catch (error) {
    return ErrorResponse(error);
  }
}

// DELETE /api/comment/[id] - Admin only
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await CheckAuthentication();
    CheckAuthorization(session, "Comment", "DELETE");

    const id = (await params).id;
    if (!id) {
      return Response.badRequest(
        "Invalid comment ID",
        APIErrorCodes.validation.INVALID_INPUT,
      );
    }

    const existingComment = await prisma.comment.findUnique({
      where: { id },
    });

    if (!existingComment) {
      return Response.notFound(
        "Comment not found",
        APIErrorCodes.notFound.COMMENT_NOT_FOUND,
      );
    }

    await prisma.comment.delete({ where: { id } });

    return Response.ok<CommentDeleteResponse>(
      { deletedCommentId: id },
      "Comment deleted successfully",
    );
  } catch (error) {
    return ErrorResponse(error);
  }
}
