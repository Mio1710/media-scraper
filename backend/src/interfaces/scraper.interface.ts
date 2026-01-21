import { ScrapeStatus } from "../types/scraper";

export interface ScrapeRequest {
  id: string;
  sourceUrl: string;
  status: ScrapeStatus;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}
