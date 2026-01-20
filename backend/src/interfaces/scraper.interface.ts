import { ScrapeStatus } from "../types";

export interface ScrapeRequest {
  id: string;
  sourceUrl: string;
  status: ScrapeStatus;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}
