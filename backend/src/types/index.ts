// Type definitions for the Media Scraper application

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

export interface ScrapeRequest {
  id: string;
  sourceUrl: string;
  status: ScrapeStatus;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Media {
  id: string;
  scrapeRequestId: string;
  url: string;
  type: MediaType;
  sourceUrl: string;
  title?: string;
  alt?: string;
  width?: number;
  height?: number;
  fileSize?: number;
  mimeType?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ScrapeUrlsInput {
  urls: string[];
}

export interface ScrapedMedia {
  url: string;
  type: MediaType;
  title?: string;
  alt?: string;
  width?: number;
  height?: number;
}

export interface ScrapeResult {
  sourceUrl: string;
  status: ScrapeStatus;
  media: ScrapedMedia[];
  errorMessage?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface MediaFilter {
  type?: MediaType;
  search?: string;
  sourceUrl?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ScrapeJobResult {
  requestId: string;
  sourceUrl: string;
  status: ScrapeStatus;
  mediaCount: number;
  errorMessage?: string;
}

export interface BulkScrapeResponse {
  totalRequests: number;
  results: ScrapeJobResult[];
}

export interface QueueJob {
  id: string;
  url: string;
  retries: number;
}

export interface ScraperConfig {
  maxConcurrentScrapes: number;
  scrapeTimeout: number;
  maxRetries: number;
}
