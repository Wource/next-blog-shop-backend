export interface Media {
  id: string;
  title: string;
  slug: string;
  alt: string | null;
  type: string;
  objectKey: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
  createdById: string;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}
