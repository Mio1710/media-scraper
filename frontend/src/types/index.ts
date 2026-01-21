// API Types
export enum MediaType {
  IMAGE = "image",
  VIDEO = "video",
}

export enum ScrapeStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  COMPLETED = "completed",
  FAILED = "failed",
}

export interface Media {
  id: string;
  scrapeRequestId: string;
  url: string;
  type: MediaType;
  sourceUrl: string;
  title: string | null;
  alt: string | null;
  width: number | null;
  height: number | null;
  fileSize: number | null;
  mimeType: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T;
  pagination: Pagination;
}

export interface ApiResponse<T> extends PaginatedResponse<T> {
  success: boolean;
  error?: string;
  message?: string;
}

export interface ScrapeJobResult {
  requestId: string;
  sourceUrl: string;
  status: ScrapeStatus;
  mediaCount: number;
  errorMessage?: string;
  updatedAt?: string;
}

export interface BulkScrapeResponse {
  message: string;
  success: boolean;
}

export interface MediaStats {
  type: MediaType;
  count: number;
}
