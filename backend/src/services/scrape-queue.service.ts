import pLimit from "p-limit";
import { config } from "../config";
import sequelize from "../config/database";
import { CreateMediaDto } from "../models/dto/media.dto";
import { mediaRepository, scrapeRequestRepository } from "../repositories";
import { BulkScrapeResponse, ScrapedMedia, ScrapeJobResult, ScrapeStatus } from "../types";
import { logger } from "../utils/logger";
import { scraperService } from "./scraper.service";

interface QueuedJob {
  readonly id: string;
  readonly url: string;
  readonly retries: number;
}

const CHUNK_SIZE = 100;

export class ScrapeQueueService {
  private readonly concurrencyLimit: number;
  private readonly maxRetries: number;

  constructor() {
    this.concurrencyLimit = config.scraper.maxConcurrentScrapes;
    this.maxRetries = config.scraper.maxRetries;
  }

  public async processBulkScrape(urls: string[]): Promise<BulkScrapeResponse> {
    const results: ScrapeJobResult[] = [];
    const limit = pLimit(this.concurrencyLimit);
    const transaction = await sequelize.transaction();

    try {
      const scrapeRequests = await scrapeRequestRepository.createBulkRequests(urls, transaction);
      await transaction.commit();

      const jobs: QueuedJob[] = scrapeRequests.map((scrap) => ({
        id: scrap.id,
        url: scrap.sourceUrl,
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

  private async saveMedia(scrapeRequestId: string, sourceUrl: string, media: ScrapedMedia[]): Promise<number> {
    if (media.length === 0) {
      return 0;
    }

    const mediaData: CreateMediaDto[] = media.map((m) => ({
      scrapeRequestId,
      url: m.url,
      type: m.type,
      sourceUrl,
      alt: m.alt,
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
