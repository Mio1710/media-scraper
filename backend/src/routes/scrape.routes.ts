import { Router } from "express";
import { scrapeController } from "../controllers";
import { validateBody, validateParams } from "../middlewares";
import { idParamSchema, scrapeUrlsSchema } from "../utils/validators";

const router = Router();

/**
 * @route POST /api/scrape
 * @description Submit URLs for scraping
 * @body { urls: string[] }
 */
router.post("/", validateBody(scrapeUrlsSchema), (req, res, next) => scrapeController.handleScrapeUrls(req, res, next));

/**
 * @route GET /api/scrape/:id
 * @description Get status of a scrape request
 */
router.get("/:id", validateParams(idParamSchema), (req, res, next) =>
  scrapeController.handleGetScrapeStatus(req, res, next),
);

export default router;
