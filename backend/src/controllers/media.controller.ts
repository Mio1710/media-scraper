import { NextFunction, Request, Response } from "express";
import { mediaService } from "../services/media.service";
import { ApiResponse, Media, MediaFilter, MediaType, PaginatedResponse } from "../types";
import { MediaQueryInput } from "../utils/validators";

export class MediaController {
  // GET /api/media requests.
  public async handleGetMedia(
    _req: Request,
    res: Response<ApiResponse<PaginatedResponse<Media>>>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { page, limit, type, search, sourceUrl } = res.locals.validated as MediaQueryInput;
      const filter = this.buildMediaFilter(type, search, sourceUrl);
      const result = await mediaService.fetchMediaPaginated({ page, limit }, filter);
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/media/:id requests.
  public async handleGetMediaById(_req: Request, res: Response<ApiResponse<Media>>, next: NextFunction): Promise<void> {
    try {
      const { id } = res.locals.validated as { id: string };
      const media = await mediaService.fetchMediaById(id);
      if (!media) {
        res.status(404).json({
          success: false,
          error: "Not found",
          message: `Media with ID ${id} not found`,
        });
        return;
      }
      res.json({
        success: true,
        data: media,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/media/stats requests.
  public async handleGetMediaStats(
    _req: Request,
    res: Response<ApiResponse<{ type: string; count: number }[]>>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const stats = await mediaService.fetchMediaStats();
      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/media/:id requests.
  public async handleDeleteMedia(_req: Request, res: Response<ApiResponse<null>>, next: NextFunction): Promise<void> {
    try {
      const { id } = res.locals.validated as { id: string };
      const deleted = await mediaService.removeMedia(id);
      if (!deleted) {
        res.status(404).json({
          success: false,
          error: "Not found",
          message: `Media with ID ${id} not found`,
        });
        return;
      }
      res.json({
        success: true,
        message: "Media deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Builds a media filter from query parameters.
   */
  private buildMediaFilter(type?: MediaType, search?: string, sourceUrl?: string): MediaFilter {
    const filter: MediaFilter = {};
    if (type) {
      filter.type = type;
    }
    if (search) {
      filter.search = search;
    }
    if (sourceUrl) {
      filter.sourceUrl = sourceUrl;
    }
    return filter;
  }
}

export const mediaController = new MediaController();
