import axiosInstance from "@/utils/axios";
import { ApiResponse, Media, MediaQueryParams, MediaStats, PaginatedResponse } from "../types";

const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

export class MediaService {
  // Media endpoints
  static async getMedia(params: MediaQueryParams = {}): Promise<PaginatedResponse<Media>> {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.set("page", params.page.toString());
    if (params.limit) queryParams.set("limit", params.limit.toString());
    if (params.type) queryParams.set("type", params.type);
    if (params.search) queryParams.set("search", params.search);
    if (params.sourceUrl) queryParams.set("sourceUrl", params.sourceUrl);

    const response = await axiosInstance.get<ApiResponse<PaginatedResponse<Media>>>(`/media?${queryParams.toString()}`);

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || "Failed to fetch media");
    }
    return response.data.data;
  }

  static async getMediaById(id: string): Promise<Media> {
    const response = await axiosInstance.get<ApiResponse<Media>>(`/media/${id}`);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || "Media not found");
    }
    return response.data.data;
  }

  static async getMediaStats(): Promise<MediaStats[]> {
    const response = await axiosInstance.get<ApiResponse<MediaStats[]>>("/media/stats");
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || "Failed to fetch media stats");
    }
    return response.data.data;
  }

  static async deleteMedia(id: string): Promise<void> {
    const response = await axiosInstance.delete<ApiResponse<null>>(`/media/${id}`);
    if (!response.data.success) {
      throw new Error(response.data.message || "Failed to delete media");
    }
  }

  // Health check
  static async healthCheck(): Promise<boolean> {
    try {
      await axiosInstance.get("/health");
      return true;
    } catch {
      return false;
    }
  }
}
