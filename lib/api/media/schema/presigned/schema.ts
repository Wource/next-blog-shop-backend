// Request -----------------------------------------

import { object, string, z } from "zod";
import { APISuccessResponse } from "../../../shared/types/response_schema/base";
import { MediaTypes } from "@/lib/api/shared/infrastructure/prisma/generated/enums";

export const presignedUploadZodSchema = object({
  title: string().min(3),
  fileName: string().min(5),
  type: z.enum(Object.values(MediaTypes)),
});

export type PresignedUploadRequest = z.infer<typeof presignedUploadZodSchema>;

// Response -------------------------------------

export interface PresignedUploadResponse extends APISuccessResponse {
  data: {
    uploadUrl: string;
    objectKey: string;
    path: string;
    contentType: string;
    slug: string;
    expiresIn: number;
  };
}
