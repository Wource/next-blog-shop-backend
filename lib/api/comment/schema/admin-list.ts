import { z } from "zod";
import { APISuccessResponse } from "../../shared/types/response_schema/base";
import { APIResponsePagination } from "../../shared/types/response_schema/pagination";
import { CommentItem } from "./comment";

export const adminCommentListQuerySchema = z.object({
  status: z.enum(["pending", "approved", "rejected", "all"]).default("pending"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export type AdminCommentListQuery = z.infer<typeof adminCommentListQuerySchema>;

export interface AdminCommentListResponse extends APISuccessResponse {
  data: {
    comments: CommentItem[];
    pagination: APIResponsePagination;
  };
}
