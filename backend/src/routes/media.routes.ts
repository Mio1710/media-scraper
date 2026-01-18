import { Router } from "express";
import { mediaController } from "../controllers";
import { validateParams, validateQuery } from "../middlewares";
import { idParamSchema, mediaQuerySchema } from "../utils/validators";

const router = Router();

/**
 * @route GET /api/media/stats
 * @description Get media statistics
 */
router.get("/stats", (req, res, next) => mediaController.handleGetMediaStats(req, res, next));

/**
 * @route GET /api/media
 * @description Get paginated list of media
 * @query { page?: number, limit?: number, type?: 'image' | 'video', search?: string }
 */
router.get("/", validateQuery(mediaQuerySchema), (req, res, next) => mediaController.handleGetMedia(req, res, next));

/**
 * @route GET /api/media/:id
 * @description Get a single media item
 */
router.get("/:id", validateParams(idParamSchema), (req, res, next) =>
  mediaController.handleGetMediaById(req, res, next),
);

/**
 * @route DELETE /api/media/:id
 * @description Delete a media item
 */
router.delete("/:id", validateParams(idParamSchema), (req, res, next) =>
  mediaController.handleDeleteMedia(req, res, next),
);

export default router;
