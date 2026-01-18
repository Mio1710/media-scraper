import pLimit from "p-limit";
import { config } from "../config";
import sequelize from "../config/database";
import { MediaData, mediaRepository, scrapeRequestRepository } from "../repositories";
import { BulkScrapeResponse, ScrapedMedia, ScrapeJobResult, ScrapeStatus } from "../types";
import { logger } from "../utils/logger";
import { scraperService } from "./scraper.service";

/**
 * Represents a job in the scraping queue.
 */
interface QueuedJob {
  readonly id: string;
  readonly url: string;
  readonly retries: number;
}

const CHUNK_SIZE = 100;

/**
 * Service responsible for managing the scraping queue and processing scrape jobs.
 * Handles concurrent scraping with retry logic and database persistence.
 */
export class ScrapeQueueService {
  private readonly concurrencyLimit: number;
  private readonly maxRetries: number;

  constructor() {
    this.concurrencyLimit = config.scraper.maxConcurrentScrapes;
    this.maxRetries = config.scraper.maxRetries;
  }

  /**
   * Processes multiple URLs for scraping in bulk.
   * @param urls - Array of URLs to scrape
   * @returns Response containing results for all scrape jobs
   */
  public async processBulkScrape(urls: string[]): Promise<BulkScrapeResponse> {
    const results: ScrapeJobResult[] = [];
    const limit = pLimit(this.concurrencyLimit);
    const transaction = await sequelize.transaction();

    try {
      const scrapeRequests = await scrapeRequestRepository.createBulkRequests(
        urls.map((url) => ({ sourceUrl: url, status: ScrapeStatus.PENDING })),
        transaction,
      );
      await transaction.commit();

      const jobs: QueuedJob[] = scrapeRequests.map((req, index) => ({
        id: req.id,
        url: urls[index],
        retries: 0,
      }));

      const jobPromises = jobs.map((job) =>
        limit(async () => {
          const result = await this.processJob(job);
          results.push(result);
          return result;
        }),
      );

      await Promise.all(jobPromises);

      return { totalRequests: urls.length, results };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Gets the status of a scrape job.
   * @param requestId - The ID of the scrape request
   * @returns The job status or null if not found
   */
  public async fetchJobStatus(requestId: string): Promise<ScrapeJobResult | null> {
    const request = await scrapeRequestRepository.findById(requestId);
    if (!request) {
      return null;
    }
    const media = await mediaRepository.findByScrapeRequestId(requestId);

    return {
      requestId: request.id,
      sourceUrl: request.sourceUrl,
      status: request.status,
      mediaCount: media.length,
      errorMessage: request.errorMessage ?? undefined,
    };
  }

  /**
   * Processes a single scrape job with retry logic.
   */
  private async processJob(job: QueuedJob): Promise<ScrapeJobResult> {
    const { id, url } = job;

    try {
      await scrapeRequestRepository.updateStatus(id, ScrapeStatus.PROCESSING);
      logger.info(`Processing scrape job ${id} for URL: ${url}`);

      const scrapedMedia = await scraperService.scrapeUrl(url);
      const mediaCount = await this.saveMedia(id, url, scrapedMedia);

      await scrapeRequestRepository.updateStatus(id, ScrapeStatus.COMPLETED);
      logger.info(`Completed scrape job ${id}: found ${mediaCount} media items`);

      return {
        requestId: id,
        sourceUrl: url,
        status: ScrapeStatus.COMPLETED,
        mediaCount,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      if (job.retries < this.maxRetries) {
        logger.warn(`Retrying job ${id} (attempt ${job.retries + 1}/${this.maxRetries}): ${errorMessage}`);
        return this.processJob({ ...job, retries: job.retries + 1 });
      }

      await scrapeRequestRepository.updateStatus(id, ScrapeStatus.FAILED, errorMessage);
      logger.error(`Failed scrape job ${id}: ${errorMessage}`);

      return {
        requestId: id,
        sourceUrl: url,
        status: ScrapeStatus.FAILED,
        mediaCount: 0,
        errorMessage,
      };
    }
  }

  /**
   * Saves scraped media to the database in chunks.
   */
  private async saveMedia(scrapeRequestId: string, sourceUrl: string, media: ScrapedMedia[]): Promise<number> {
    if (media.length === 0) {
      return 0;
    }

    const mediaData: MediaData[] = media.map((m) => ({
      scrapeRequestId,
      url: m.url,
      type: m.type,
      sourceUrl,
      title: m.title,
      alt: m.alt,
      width: m.width,
      height: m.height,
    }));

    let insertedCount = 0;
    for (let i = 0; i < mediaData.length; i += CHUNK_SIZE) {
      const chunk = mediaData.slice(i, i + CHUNK_SIZE);
      const inserted = await mediaRepository.createBulkMedia(chunk);
      insertedCount += inserted.length;
    }

    return insertedCount;
  }
}

export const scrapeQueueService = new ScrapeQueueService();
