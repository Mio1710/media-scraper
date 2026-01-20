import { config } from "../config";
import { Media } from "../interfaces";
import { mediaRepository } from "../repositories";
import { MediaFilter, PaginatedResponse, PaginationParams } from "../types";

export class MediaService {
  public async fetchMediaPaginated(
    pagination: Partial<PaginationParams>,
    filter: MediaFilter,
  ): Promise<PaginatedResponse<Media>> {
    const normalizedPagination: PaginationParams = {
      page: pagination.page ?? 1,
      limit: Math.min(pagination.limit ?? config.pagination.defaultPageSize, config.pagination.maxPageSize),
    };
    return mediaRepository.findAllPaginated(normalizedPagination, filter);
  }

  public async fetchMediaById(id: string): Promise<Media | null> {
    const media = await mediaRepository.findById(id);
    if (!media) {
      return null;
    }
    return media.toJSON() as Media;
  }

  public async fetchMediaByScrapeRequest(scrapeRequestId: string): Promise<Media[]> {
    const media = await mediaRepository.findByScrapeRequestId(scrapeRequestId);
    return media.map((m) => m.toJSON() as Media);
  }

  public async fetchMediaStats(): Promise<{ type: string; count: number }[]> {
    return mediaRepository.countByType();
  }

  public async removeMedia(id: string): Promise<boolean> {
    const deletedCount = await mediaRepository.deleteById(id);
    return deletedCount > 0;
  }
}

export const mediaService = new MediaService();
