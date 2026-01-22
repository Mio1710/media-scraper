import { Router } from "express";
import { scrapeController } from "../controllers";
import { validateBody, validateQuery } from "../middlewares";
import { scraperQuerySchema, scrapeUrlsSchema } from "../utils/validators";

const router = Router();

/**
 * @route POST /api/scrape
 * @description Submit URLs for scraping
 * @body { urls: string[] }
 */
router.post("/", validateBody(scrapeUrlsSchema), (req, res, next) => scrapeController.handleScrapeUrls(req, res, next));

router.get("/", validateQuery(scraperQuerySchema), (req, res, next) =>
  scrapeController.getScrapeHistory(req, res, next),
);

export default router;
