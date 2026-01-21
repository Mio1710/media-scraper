import { Job, Queue, Worker } from "bullmq";
import getRedisClient from "../config/redis";
import { scrapeQueueService } from "../services";

const connection = getRedisClient();
export const requestQueue = new Queue("requests", {
  connection: connection.options,
});

export const requestWorker = new Worker(
  "requests",
  async (job: Job) => {
    scrapeQueueService.processBulkScrape(job.data);
    return { success: true };
  },
  {
    connection: connection.options,
    limiter: {
      max: 2,
      duration: 1000,
    },
    concurrency: 2,
    removeOnComplete: {
      age: 3600, // seconds
    },
    removeOnFail: { age: 36000 }, // seconds
  },
);

requestWorker.on("completed", (job) => {
  console.log(`Job ${job.id} completed!`);
});

requestWorker.on("failed", (job, err) => {
  console.error(`Job ${job?.id} failed:`, err);
});
