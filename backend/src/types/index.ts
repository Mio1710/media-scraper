// Type definitions for the Media Scraper application

export enum MediaType {
  IMAGE = "image",
  VIDEO = "video",
}

export interface MediaFilter {
  type?: MediaType;
  search?: string;
  sourceUrl?: string;
}

export interface QueueJob {
  id: string;
  url: string;
  retries: number;
}
