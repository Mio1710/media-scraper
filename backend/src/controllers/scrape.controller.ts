import { NextFunction, Request, Response } from "express";
import { scrapeQueueService } from "../services/scrape-queue.service";
import { ApiResponse, BulkScrapeResponse, ScrapeJobResult } from "../types";
import { logger } from "../utils/logger";
import { ScrapeUrlsInput } from "../utils/validators";

export class ScrapeController {
  // POST /api/scrape requests.
  public async handleScrapeUrls(
    _req: Request,
    res: Response<ApiResponse<BulkScrapeResponse>>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { urls } = res.locals.validated as ScrapeUrlsInput;
      logger.info(`Received scrape request for ${urls.length} URLs`);
      const result = await scrapeQueueService.processBulkScrape(urls);
      res.status(202).json({
        success: true,
        data: result,
        message: `Processing ${urls.length} URLs`,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/scrape/:id requests.
  public async handleGetScrapeStatus(
    _req: Request,
    res: Response<ApiResponse<ScrapeJobResult>>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = res.locals.validated as { id: string };
      const result = await scrapeQueueService.fetchJobStatus(id);
      if (!result) {
        res.status(404).json({
          success: false,
          error: "Not found",
          message: `Scrape request with ID ${id} not found`,
        });
        return;
      }
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const scrapeController = new ScrapeController();
