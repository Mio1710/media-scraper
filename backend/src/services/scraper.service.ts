import axios, { AxiosError } from "axios";
import * as cheerio from "cheerio";
import { Element } from "domhandler";
import { URL } from "url";
import config from "../config";
import { MediaType, ScrapedMedia } from "../types";
import { logger } from "../utils/logger";

/**
 * Configuration options for the scraper service.
 */
interface ScraperOptions {
  readonly timeout: number;
  readonly maxContentLength: number;
  readonly userAgent: string;
}

const MAX_CONTENT_LENGTH = 10 * 1024 * 1024; // 10 MB
const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".bmp", ".ico"] as const;
const VIDEO_EXTENSIONS = [".mp4", ".webm", ".ogg", ".avi", ".mov", ".wmv", ".flv", ".mkv"] as const;

const MAX_TITLE_LENGTH = 500;
const MAX_ALT_LENGTH = 1000;

/**
 * Service responsible for scraping media (images and videos) from web pages.
 * Uses Cheerio for HTML parsing and Axios for HTTP requests.
 */
export class ScraperService {
  public async scrapeUrl(url: string): Promise<ScrapedMedia[]> {
    const media: ScrapedMedia[] = [];
    const seenUrls = new Set<string>();

    try {
      logger.debug(`Scraping URL: ${url}`);
      const htmlContent = await this.fetchPageContent(url);
      const $ = cheerio.load(htmlContent);

      this.extractImagesFromImgTags($, url, media, seenUrls);
      this.extractImagesFromPictureTags($, url, media, seenUrls);
      this.extractVideosFromVideoTags($, url, media, seenUrls);
      this.extractVideosFromIframes($, url, media, seenUrls);
      this.extractBackgroundImages($, url, media, seenUrls);
      this.extractOpenGraphMedia($, url, media, seenUrls);

      logger.debug(`Found ${media.length} media items from ${url}`);
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
      const title = $(element).attr("title");
      const width = $(element).attr("width");
      const height = $(element).attr("height");

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
      const title = $(element).attr("title");
      const width = $(element).attr("width");
      const height = $(element).attr("height");

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
    const ogTitle = $('meta[property="og:title"]').attr("content")?.substring(0, MAX_TITLE_LENGTH);

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

  /**
   * Parses a width/height string value to a number.
   */
  private parseWidthHeight(value: string | undefined): number | undefined {
    if (!value) return undefined;
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? undefined : parsed;
  }
}

export const scraperService = new ScraperService();
