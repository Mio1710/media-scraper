import axios, { AxiosError } from "axios";
import * as cheerio from "cheerio";
import { Element } from "domhandler";
import { URL } from "url";
import config from "../config";
import { PaginatedResponse } from "../interfaces/pagination";
import { scrapeRequestRepository } from "../repositories";
import { MediaType } from "../types";
import { ScrapedMedia, ScrapeJobResult, ScrapeStatus } from "../types/scraper";
import { logger } from "../utils/logger";

const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".bmp", ".ico"] as const;
const VIDEO_EXTENSIONS = [".mp4", ".webm", ".ogg", ".avi", ".mov", ".wmv", ".flv", ".mkv"] as const;

const MAX_ALT_LENGTH = 1000;

export class ScraperService {
  public async fetchScrapeHistory(
    pagination: { page: number; limit: number },
    status?: ScrapeStatus,
  ): Promise<PaginatedResponse<ScrapeJobResult>> {
    const { data, pagination: pag } = await scrapeRequestRepository.findAllPaginated(pagination, status);

    return {
      data,
      pagination: pag,
    };
  }
  public async scrapeUrl(url: string): Promise<ScrapedMedia[]> {
    const media: ScrapedMedia[] = [];
    const seenUrls = new Set<string>();

    try {
      logger.info(`Scraping URL: ${url}`);
      const htmlContent = await this.fetchPageContent(url);
      const $ = cheerio.load(htmlContent);

      this.extractImagesFromImgTags($, url, media, seenUrls);
      this.extractImagesFromPictureTags($, url, media, seenUrls);
      this.extractVideosFromVideoTags($, url, media, seenUrls);
      this.extractVideosFromIframes($, url, media, seenUrls);
      this.extractBackgroundImages($, url, media, seenUrls);
      this.extractOpenGraphMedia($, url, media, seenUrls);

      logger.info(`Found ${media.length} media items from ${url}`);
      return media;
    } catch (error) {
      if (error instanceof AxiosError) {
        logger.error(`Failed to scrape ${url}: ${error.message}`);
        throw new Error(`Failed to fetch URL: ${error.message}`);
      }
      if (error instanceof Error) {
        logger.error(`Failed to scrape ${url}: ${error.message}`);
        throw error;
      }
      throw new Error(`Failed to scrape ${url}: Unknown error`);
    }
  }

  private async fetchPageContent(url: string): Promise<string> {
    const response = await axios.get<string>(url, {
      timeout: config.scraper.scrapeTimeout,
      maxBodyLength: config.scraper.maxBodyLength,
      headers: {
        "User-Agent": config.scraper.userAgent,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
      maxRedirects: 3,
      responseType: "text",
    });
    return response.data;
  }

  private extractImagesFromImgTags(
    $: cheerio.CheerioAPI,
    baseUrl: string,
    media: ScrapedMedia[],
    seenUrls: Set<string>,
  ): void {
    $("img").each((_: number, element: Element) => {
      const src = $(element).attr("src");
      const dataSrc = $(element).attr("data-src");
      const srcset = $(element).attr("srcset");
      const alt = $(element).attr("alt");

      const imageSources = [src, dataSrc];
      if (srcset) {
        const srcsetUrls = srcset.split(",").map((s: string) => s.trim().split(" ")[0]);
        imageSources.push(...srcsetUrls);
      }

      imageSources.forEach((imgSrc: string | undefined) => {
        if (!imgSrc) return;
        const resolvedUrl = this.resolveUrl(baseUrl, imgSrc);
        if (!resolvedUrl || seenUrls.has(resolvedUrl)) return;
        seenUrls.add(resolvedUrl);
        media.push({
          url: resolvedUrl,
          type: MediaType.IMAGE,
          alt: alt?.substring(0, MAX_ALT_LENGTH),
        });
      });
    });
  }

  /**
   * Extracts images from <picture> tags.
   */
  private extractImagesFromPictureTags(
    $: cheerio.CheerioAPI,
    baseUrl: string,
    media: ScrapedMedia[],
    seenUrls: Set<string>,
  ): void {
    $("picture source").each((_: number, element: Element) => {
      const srcset = $(element).attr("srcset");
      if (!srcset) return;
      const srcsetUrls = srcset.split(",").map((s: string) => s.trim().split(" ")[0]);
      srcsetUrls.forEach((imgSrc: string) => {
        const resolvedUrl = this.resolveUrl(baseUrl, imgSrc);
        if (!resolvedUrl || seenUrls.has(resolvedUrl)) return;
        seenUrls.add(resolvedUrl);
        media.push({ url: resolvedUrl, type: MediaType.IMAGE });
      });
    });
  }

  /**
   * Extracts videos from <video> tags.
   */
  private extractVideosFromVideoTags(
    $: cheerio.CheerioAPI,
    baseUrl: string,
    media: ScrapedMedia[],
    seenUrls: Set<string>,
  ): void {
    $("video").each((_: number, element: Element) => {
      const src = $(element).attr("src");
      const poster = $(element).attr("poster");

      if (src) {
        const resolvedUrl = this.resolveUrl(baseUrl, src);
        if (resolvedUrl && !seenUrls.has(resolvedUrl)) {
          seenUrls.add(resolvedUrl);
          media.push({
            url: resolvedUrl,
            type: MediaType.VIDEO,
          });
        }
      }

      if (poster) {
        const resolvedPoster = this.resolveUrl(baseUrl, poster);
        if (resolvedPoster && !seenUrls.has(resolvedPoster)) {
          seenUrls.add(resolvedPoster);
          media.push({
            url: resolvedPoster,
            type: MediaType.IMAGE,
          });
        }
      }

      $(element)
        .find("source")
        .each((_: number, source: Element) => {
          const sourceSrc = $(source).attr("src");
          if (!sourceSrc) return;
          const resolvedUrl = this.resolveUrl(baseUrl, sourceSrc);
          if (!resolvedUrl || seenUrls.has(resolvedUrl)) return;
          seenUrls.add(resolvedUrl);
          media.push({
            url: resolvedUrl,
            type: MediaType.VIDEO,
          });
        });
    });
  }

  /**
   * Extracts videos from <iframe> tags (YouTube, Vimeo, etc.).
   */
  private extractVideosFromIframes(
    $: cheerio.CheerioAPI,
    baseUrl: string,
    media: ScrapedMedia[],
    seenUrls: Set<string>,
  ): void {
    const videoHosts = ["youtube.com", "youtu.be", "vimeo.com", "dailymotion.com"];

    $("iframe").each((_: number, element: Element) => {
      const src = $(element).attr("src");
      if (!src) return;
      const resolvedUrl = this.resolveUrl(baseUrl, src);
      if (!resolvedUrl || seenUrls.has(resolvedUrl)) return;
      const isVideoEmbed = videoHosts.some((host) => resolvedUrl.includes(host));
      if (!isVideoEmbed) return;
      seenUrls.add(resolvedUrl);
      media.push({
        url: resolvedUrl,
        type: MediaType.VIDEO,
      });
    });
  }

  /**
   * Extracts images from background-image CSS properties.
   */
  private extractBackgroundImages(
    $: cheerio.CheerioAPI,
    baseUrl: string,
    media: ScrapedMedia[],
    seenUrls: Set<string>,
  ): void {
    $('[style*="background"]').each((_: number, element: Element) => {
      const style = $(element).attr("style");
      if (!style) return;
      const urlMatches = style.match(/url\(['"]?([^'"()]+)['"]?\)/gi);
      if (!urlMatches) return;
      urlMatches.forEach((match: string) => {
        const urlMatch = match.match(/url\(['"]?([^'"()]+)['"]?\)/i);
        if (!urlMatch?.[1]) return;
        const resolvedUrl = this.resolveUrl(baseUrl, urlMatch[1]);
        if (!resolvedUrl || seenUrls.has(resolvedUrl)) return;
        const type = this.detectMediaType(resolvedUrl);
        if (type !== MediaType.IMAGE) return;
        seenUrls.add(resolvedUrl);
        media.push({ url: resolvedUrl, type: MediaType.IMAGE });
      });
    });
  }

  /**
   * Extracts media from Open Graph meta tags.
   */
  private extractOpenGraphMedia(
    $: cheerio.CheerioAPI,
    baseUrl: string,
    media: ScrapedMedia[],
    seenUrls: Set<string>,
  ): void {
    $('meta[property="og:image"]').each((_: number, element: Element) => {
      const content = $(element).attr("content");
      if (!content) return;
      const resolvedUrl = this.resolveUrl(baseUrl, content);
      if (!resolvedUrl || seenUrls.has(resolvedUrl)) return;
      seenUrls.add(resolvedUrl);
      media.push({ url: resolvedUrl, type: MediaType.IMAGE });
    });

    $('meta[property="og:video"]').each((_: number, element: Element) => {
      const content = $(element).attr("content");
      if (!content) return;
      const resolvedUrl = this.resolveUrl(baseUrl, content);
      if (!resolvedUrl || seenUrls.has(resolvedUrl)) return;
      seenUrls.add(resolvedUrl);
      media.push({ url: resolvedUrl, type: MediaType.VIDEO });
    });
  }

  /**
   * Resolves a relative URL against a base URL.
   */
  private resolveUrl(baseUrl: string, relativeUrl: string): string | null {
    if (!relativeUrl) return null;
    if (relativeUrl.startsWith("data:") || relativeUrl.startsWith("javascript:")) return null;
    if (relativeUrl.startsWith("http://") || relativeUrl.startsWith("https://")) return relativeUrl;
    try {
      const base = new URL(baseUrl);
      const resolved = new URL(relativeUrl, base);
      return resolved.href;
    } catch {
      return null;
    }
  }

  /**
   * Detects the media type based on URL and tag name.
   */
  private detectMediaType(url: string, tagName?: string): MediaType | null {
    const lowercaseUrl = url.toLowerCase();
    if (tagName === "video" || tagName === "source") return MediaType.VIDEO;
    if (tagName === "img") return MediaType.IMAGE;
    for (const ext of IMAGE_EXTENSIONS) {
      if (lowercaseUrl.includes(ext)) return MediaType.IMAGE;
    }
    for (const ext of VIDEO_EXTENSIONS) {
      if (lowercaseUrl.includes(ext)) return MediaType.VIDEO;
    }
    return null;
  }
}

export const scraperService = new ScraperService();
