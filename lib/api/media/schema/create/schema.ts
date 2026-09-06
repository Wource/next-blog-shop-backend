// Request -----------------------------------------

import { number, object, string, z } from "zod";
import { APISuccessResponse } from "../../../shared/types/response_schema/base";
import { MediaTypes } from "@/lib/api/shared/infrastructure/prisma/generated/enums";

export const mediaFinalizeZodSchema = object({
  title: string().min(3),
  slug: string().min(1),
  alt: string().optional(),
  type: z.enum(Object.values(MediaTypes)),
  fileName: string().min(5),
  objectKey: string().min(1),
  path: string().url(),
  mimeType: string().min(1),
  sizeBytes: number().int().min(1),
});

export type MediaFinalizeRequest = z.infer<typeof mediaFinalizeZodSchema>;

// Response -------------------------------------

export type MediaFinalizeResponse = APISuccessResponse;
