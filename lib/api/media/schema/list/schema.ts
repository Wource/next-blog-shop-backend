import { z } from "zod";
import { APISuccessResponse } from "../../../shared/types/response_schema/base";
import { APIResponsePagination } from "../../../shared/types/response_schema/pagination";
import { Media } from "../schema";
import { MediaTypes } from "@/lib/api/shared/infrastructure/prisma/generated/enums";

export const mediaListQuerySchema = z.object({
  type: z.enum(Object.values(MediaTypes)).optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export type MediaListQuery = z.infer<typeof mediaListQuerySchema>;

export interface MediaListResponse extends APISuccessResponse {
  data: {
    media: Media[];
    pagination: APIResponsePagination;
  };
}
