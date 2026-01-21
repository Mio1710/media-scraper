import compression from "compression";
import cors from "cors";
import express, { Express, NextFunction, Request, Response } from "express";
import helmet from "helmet";
import { config } from "./config";
import { connectDatabase } from "./config/database";
import { apiRateLimiter, errorHandler, notFoundHandler } from "./middlewares";
import routes from "./routes";
import { logger } from "./utils/logger";

class App {
  public app: Express;

  constructor() {
    this.app = express();
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddlewares(): void {
    // Security middlewares
    this.app.use(
      helmet({
        crossOriginResourcePolicy: { policy: "cross-origin" },
      }),
    );

    // CORS configuration
    this.app.use(
      cors({
        origin: config.server.crossOrigin,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
        credentials: true,
      }),
    );

    // Compression
    this.app.use(compression());

    // Body parsing
    this.app.use(express.json({ limit: "10mb" }));
    this.app.use(express.urlencoded({ extended: true, limit: "10mb" }));

    // Rate limiting
    this.app.use("/api/", apiRateLimiter);

    // Request logging
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      const start = Date.now();
      res.on("finish", () => {
        const duration = Date.now() - start;
        logger.debug(`${req.method} ${req.path} ${res.statusCode} - ${duration}ms`);
      });
      next();
    });
  }

  private initializeRoutes(): void {
    this.app.use("/api", routes);

    // Root endpoint
    this.app.get("/", (_req: Request, res: Response) => {
      res.json({
        success: true,
        message: "Media Scraper API",
        version: "1.0.0",
        docs: "/api/health",
      });
    });
  }

  private initializeErrorHandling(): void {
    this.app.use(notFoundHandler);
    this.app.use(errorHandler);
  }

  public async start(): Promise<void> {
    try {
      // Connect to database
      await connectDatabase();

      // Start server
      this.app.listen(config.server.port, config.server.host, () => {
        logger.info(`🚀 Server running on http://${config.server.host}:${config.server.port}`);
        logger.info(`📊 Environment: ${config.server.nodeEnv}`);
      });
    } catch (error) {
      logger.error("Failed to start server:", error);
      process.exit(1);
    }
  }
}

export default App;
