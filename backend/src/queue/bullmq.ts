import { Job, Queue, Worker } from "bullmq";
import getRedisClient from "../config/redis";
import { scrapeQueueService } from "../services";
import logger from "../utils/logger";

const connection = getRedisClient();
export const requestQueue = new Queue("requests", {
  connection: connection.options,
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: {
      age: 10,
    },
    backoff: {
      type: "fixed",
      delay: 5000,
    },
    attempts: 5,
  },
});

export const requestWorker = new Worker(
  "requests",
  async (job: Job) => {
    await scrapeQueueService.processBulkScrape(job.data);
    return { success: true };
  },
  {
    connection: connection.options,
    limiter: {
      max: 2,
      duration: 1000,
    },
    concurrency: 2,
  },
);

requestWorker.on("completed", async (job) => {
  logger.debug(`requestWorker: Job ${job?.data} completed!`);
});

requestWorker.on("failed", (job, err: Error) => {
  logger.error(`requestWorker: Job ${job?.data} failed ${job?.attemptsStarted}: ${err.message}`);
});
