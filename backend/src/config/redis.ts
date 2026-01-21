import Redis from "ioredis";
import { logger } from "../utils/logger";
import { config } from "./index";

let redis: Redis | null = null;

export const getRedisClient = (): Redis => {
  if (!redis) {
    redis = new Redis({
      host: config.redis.host,
      port: config.redis.port,
    });

    redis.on("connect", () => {
      logger.info("Redis client connected");
    });

    redis.on("error", (error: Error) => {
      logger.error("Redis client error:", error);
    });

    redis.on("close", () => {
      logger.info("Redis client disconnected");
    });
  }

  return redis;
};

export const closeRedisConnection = async (): Promise<void> => {
  if (redis) {
    await redis.quit();
    redis = null;
    logger.info("Redis connection closed");
  }
};

export default getRedisClient;
