import Redis from "ioredis";
import { logger } from "../utils/logger";
import { config } from "./index";

let redis: Redis | null = null;

export const getRedisClient = (): Redis => {
  if (!redis) {
    redis = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      maxRetriesPerRequest: 3,
      retryStrategy: (times: number) => {
        if (times > 3) {
          logger.error("Redis connection failed after 3 retries");
          return null;
        }
        return Math.min(times * 100, 3000);
      },
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
