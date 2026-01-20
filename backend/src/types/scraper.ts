import { MediaType } from ".";

export enum ScrapeStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  COMPLETED = "completed",
  FAILED = "failed",
}
export interface ScrapeUrlsInput {
  urls: string[];
}

export interface ScrapedMedia {
  url: string;
  type: MediaType;
  alt?: string;
}
export interface ScrapeResult {
  sourceUrl: string;
  status: ScrapeStatus;
  media: ScrapedMedia[];
  errorMessage?: string;
}

export interface ScrapeJobResult {
  id: string;
  sourceUrl: string;
  status: ScrapeStatus;
  mediaCount: number;
  errorMessage?: string;
}

export interface BulkScrapeResponse {
  totalRequests: number;
  results: ScrapeJobResult[];
}

export interface ScraperConfig {
  maxConcurrentScrapes: number;
  scrapeTimeout: number;
  maxRetries: number;
}
