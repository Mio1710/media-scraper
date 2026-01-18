import { Router } from "express";
import mediaRoutes from "./media.routes";
import scrapeRoutes from "./scrape.routes";

const router = Router();

// Health check
router.get("/health", (_req, res) => {
  res.json({
    success: true,
    message: "Media Scraper API is running",
    timestamp: new Date().toISOString(),
  });
});

// Mount routes
router.use("/scrape", scrapeRoutes);
router.use("/media", mediaRoutes);

export default router;
