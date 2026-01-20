import { z } from "zod";
import { MediaType } from "../types";

// URL validation regex
const urlRegex = /^https?:\/\/.+/i;

// Scrape URLs request schema
export const scrapeUrlsSchema = z.object({
  urls: z
    .array(z.string().regex(urlRegex, "Invalid URL format. Must start with http:// or https://"))
    .min(1, "At least one URL is required")
    .max(1000, "Maximum 1000 URLs allowed per request"),
});

export const basePaginationSchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .pipe(z.number().min(1).default(1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20))
    .pipe(z.number().min(1).max(100).default(20)),
});

// Media query parameters schema
export const mediaQuerySchema = z.object({
  ...basePaginationSchema.shape,
  type: z.enum([MediaType.IMAGE, MediaType.VIDEO]).optional(),
  search: z.string().optional(),
  sourceUrl: z.string().optional(),
});

// Single URL validation schema
export const urlSchema = z.object({
  url: z.string().regex(urlRegex, "Invalid URL format"),
});

// ID parameter schema
export const idParamSchema = z.object({
  id: z.string().uuid("Invalid ID format"),
});

// Inferred types from schemas
export type ScrapeUrlsInput = z.infer<typeof scrapeUrlsSchema>;
export type MediaQueryInput = z.infer<typeof mediaQuerySchema>;
export type IdParamInput = z.infer<typeof idParamSchema>;
