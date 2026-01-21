import { NextFunction, Request, Response } from "express";
import { ApiResponse } from "../interfaces/pagination";
import { requestQueue } from "../queue/bullmq";
import { scraperService } from "../services";
import { scrapeQueueService } from "../services/scrape-queue.service";
import { BulkScrapeResponse, ScrapeJobResult } from "../types/scraper";
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
      requestQueue.add("bulkScrape", urls ?? []);
      logger.info(`Received scrape request add ${urls.length} URLs`);
      res.status(202).json({
        success: true,
        message: `Processing ${urls.length} URLs`,
      });
    } catch (error) {
      next(error);
    }
  }

  // Get /api/scrape
  public async getScrapeHistory(
    _req: Request,
    res: Response<ApiResponse<ScrapeJobResult[]>>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { page, limit, status } = res.locals.validated;
      const result = await scraperService.fetchScrapeHistory({ page, limit }, status);
      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      logger.error("Error fetching scrape history:", error);
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
