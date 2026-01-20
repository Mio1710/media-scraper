import { ApiResponse, BulkScrapeResponse, ScrapeJobResult } from "@/types";
import axiosInstance from "@/utils/axios";

export class ScraperService {
  static async scrapeUrls(urls: string[]): Promise<BulkScrapeResponse> {
    const response = await axiosInstance.post<ApiResponse<BulkScrapeResponse>>("/scrape", { urls });
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || "Failed to initiate scraping");
    }
    return response.data.data;
  }

  static async getScrapeStatus(id: string): Promise<ScrapeJobResult> {
    const response = await axiosInstance.get<ApiResponse<ScrapeJobResult>>(`/scrape/${id}`);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || "Failed to get scrape status");
    }
    return response.data.data;
  }
}
