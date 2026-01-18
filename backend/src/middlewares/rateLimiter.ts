import rateLimit from "express-rate-limit";
import { config } from "../config";

export const apiRateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    success: false,
    error: "Too Many Requests",
    message: "Too many requests from this IP, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limiter for scrape endpoints
export const scrapeRateLimiter = rateLimit({
  windowMs: 60000, // 1 minute
  max: 100, // 100 requests per minute
  message: {
    success: false,
    error: "Too Many Requests",
    message: "Too many scrape requests, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
