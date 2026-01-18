import winston from "winston";
import { config } from "../config";

const { combine, timestamp, printf, colorize, errors } = winston.format;

const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

export const logger = winston.createLogger({
  level: config.server.nodeEnv === "development" ? "debug" : "info",
  format: combine(errors({ stack: true }), timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), logFormat),
  transports: [
    new winston.transports.Console({
      format: combine(colorize(), timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), logFormat),
    }),
    new winston.transports.File({
      filename: "logs/error.log",
      level: "error",
    }),
    new winston.transports.File({
      filename: "logs/combined.log",
    }),
  ],
});

// Create a stream for morgan HTTP logger
export const logStream = {
  write: (message: string): void => {
    logger.info(message.trim());
  },
};

export default logger;
