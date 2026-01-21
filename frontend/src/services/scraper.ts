import { ApiResponse, BulkScrapeResponse, ScrapeJobResult } from "@/types";
import axiosInstance from "@/utils/axios";

export class ScraperService {
  static async scrapeUrls(urls: string[]): Promise<BulkScrapeResponse> {
    const response = await axiosInstance.post<BulkScrapeResponse>("/scrape", { urls });
    if (!response.data.success || !response.data.message) {
      throw new Error(response.data.message || "Failed to initiate scraping");
    }
    return response.data;
  }

  static async getScrapeStatus(id: string): Promise<string> {
    const response = await axiosInstance.get<ApiResponse<string>>(`/scrape/${id}`);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || "Failed to get scrape status");
    }
    return response.data.message ?? "";
  }

  static async getScrapeHistory(page: number, limit: number, status?: string): Promise<ApiResponse<ScrapeJobResult[]>> {
    const params: Record<string, any> = { page, limit };
    if (status) {
      params.status = status;
    }
    const response = await axiosInstance.get<ApiResponse<ScrapeJobResult[]>>("/scrape", { params });
    if (!response.data.success) {
      throw new Error(response.data.message || "Failed to get scrape history");
    }
    return response.data;
  }
}
