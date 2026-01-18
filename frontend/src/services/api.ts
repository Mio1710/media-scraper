import axios, { AxiosError, AxiosInstance } from "axios";
import {
  ApiResponse,
  BulkScrapeResponse,
  Media,
  MediaQueryParams,
  MediaStats,
  PaginatedResponse,
  ScrapeJobResult,
} from "../types";

const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 60000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError<ApiResponse<unknown>>) => {
        const message = error.response?.data?.message || error.message || "An error occurred";
        return Promise.reject(new Error(message));
      },
    );
  }

  // Scrape endpoints
  async scrapeUrls(urls: string[]): Promise<BulkScrapeResponse> {
    const response = await this.client.post<ApiResponse<BulkScrapeResponse>>("/scrape", { urls });
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || "Failed to initiate scraping");
    }
    return response.data.data;
  }

  async getScrapeStatus(id: string): Promise<ScrapeJobResult> {
    const response = await this.client.get<ApiResponse<ScrapeJobResult>>(`/scrape/${id}`);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || "Failed to get scrape status");
    }
    return response.data.data;
  }

  // Media endpoints
  async getMedia(params: MediaQueryParams = {}): Promise<PaginatedResponse<Media>> {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.set("page", params.page.toString());
    if (params.limit) queryParams.set("limit", params.limit.toString());
    if (params.type) queryParams.set("type", params.type);
    if (params.search) queryParams.set("search", params.search);
    if (params.sourceUrl) queryParams.set("sourceUrl", params.sourceUrl);

    const response = await this.client.get<ApiResponse<PaginatedResponse<Media>>>(`/media?${queryParams.toString()}`);

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || "Failed to fetch media");
    }
    return response.data.data;
  }

  async getMediaById(id: string): Promise<Media> {
    const response = await this.client.get<ApiResponse<Media>>(`/media/${id}`);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || "Media not found");
    }
    return response.data.data;
  }

  async getMediaStats(): Promise<MediaStats[]> {
    const response = await this.client.get<ApiResponse<MediaStats[]>>("/media/stats");
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || "Failed to fetch media stats");
    }
    return response.data.data;
  }

  async deleteMedia(id: string): Promise<void> {
    const response = await this.client.delete<ApiResponse<null>>(`/media/${id}`);
    if (!response.data.success) {
      throw new Error(response.data.message || "Failed to delete media");
    }
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      await this.client.get("/health");
      return true;
    } catch {
      return false;
    }
  }
}

export const apiClient = new ApiClient();
export default apiClient;
