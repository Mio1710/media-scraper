import App from "./app";
import { logger } from "./utils/logger";

const app = new App();

// Graceful shutdown
const gracefulShutdown = async (signal: string): Promise<void> => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  process.exit(0);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Handle uncaught exceptions
process.on("uncaughtException", (error: Error) => {
  logger.error("Uncaught Exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason: unknown) => {
  logger.error("Unhandled Rejection:", reason);
  process.exit(1);
});

// Start the application
app.start().catch((error) => {
  logger.error("Failed to start application:", error);
  process.exit(1);
});
