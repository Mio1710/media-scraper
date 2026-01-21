/**
 * Load Test for Media Scraper API
 *
 * This test simulates ~5000 concurrent scraping requests
 * to verify the system can handle the load with 1 CPU and 1GB RAM.
 *
 * Run with: npm run test:load
 */

import autocannon from "autocannon";

interface LoadTestConfig {
  url: string;
  connections: number;
  duration: number;
  pipelining: number;
  workers: number;
}

interface LoadTestResult {
  title: string;
  url: string;
  duration: number;
  connections: number;
  requests: {
    total: number;
    average: number;
    mean: number;
    p99: number;
  };
  latency: {
    average: number;
    mean: number;
    p99: number;
    max: number;
  };
  throughput: {
    average: number;
    mean: number;
    total: number;
  };
  errors: number;
  timeouts: number;
  non2xx: number;
}

const testUrls = [
  "https://tuoitre.vn/du-lich.htm",
  "https://vnexpress.net/giai-tri",
  "https://www.wikipedia.org",
  "https://baomoi.com/chu-de.epi",
  "https://vnexpress.net/suc-khoe",
  "https://baomoi.com/tin-video.epi",
];

const generateUrlBatch = (batchSize: number): string[] => {
  const urls: string[] = [];
  for (let i = 0; i < batchSize; i++) {
    urls.push(testUrls[i % testUrls.length]);
  }
  return urls;
};

const runLoadTest = async (config: LoadTestConfig): Promise<LoadTestResult> => {
  return new Promise((resolve, reject) => {
    const instance = autocannon(
      {
        url: config.url,
        connections: config.connections,
        duration: config.duration,
        pipelining: config.pipelining,
        workers: config.workers,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          urls: generateUrlBatch(10), // Each request scrapes 10 URLs
        }),
      },
      (err, result) => {
        if (err) {
          reject(err);
          return;
        }

        const testResult: LoadTestResult = {
          title: result.title ?? "Load Test",
          url: result.url,
          duration: result.duration,
          connections: result.connections,
          requests: {
            total: result.requests.total,
            average: result.requests.average,
            mean: result.requests.mean,
            p99: result.requests.p99,
          },
          latency: {
            average: result.latency.average,
            mean: result.latency.mean,
            p99: result.latency.p99,
            max: result.latency.max,
          },
          throughput: {
            average: result.throughput.average,
            mean: result.throughput.mean,
            total: result.throughput.total,
          },
          errors: result.errors,
          timeouts: result.timeouts,
          non2xx: result.non2xx,
        };

        resolve(testResult);
      },
    );

    // Track progress
    autocannon.track(instance, { renderProgressBar: true });
  });
};

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const printResults = (result: LoadTestResult): void => {
  console.log("\n" + "=".repeat(60));
  console.log("📊 LOAD TEST RESULTS");
  console.log("=".repeat(60));
  console.log(`\n🎯 Target: ${result.url}`);
  console.log(`⏱️  Duration: ${result.duration} seconds`);
  console.log(`🔗 Connections: ${result.connections}`);

  console.log("\n📈 REQUESTS:");
  console.log(`   Total:   ${result.requests.total}`);
  console.log(`   Average: ${result.requests.average.toFixed(2)} req/sec`);
  console.log(`   P99:     ${result.requests.p99} req/sec`);

  console.log("\n⏰ LATENCY:");
  console.log(`   Average: ${result.latency.average.toFixed(2)} ms`);
  console.log(`   P99:     ${result.latency.p99} ms`);
  console.log(`   Max:     ${result.latency.max} ms`);

  console.log("\n📦 THROUGHPUT:");
  console.log(`   Average: ${formatBytes(result.throughput.average)}/sec`);
  console.log(`   Total:   ${formatBytes(result.throughput.total)}`);

  console.log("\n❌ ERRORS:");
  console.log(`   Errors:   ${result.errors}`);
  console.log(`   Timeouts: ${result.timeouts}`);
  console.log(`   Non-2xx:  ${result.non2xx}`);

  console.log("\n" + "=".repeat(60));

  // Performance assessment
  let successRate = 0;
  if (result.requests.total > 0) {
    successRate = Math.max(
      0,
      Math.min(100, ((result.requests.total - result.errors - result.timeouts) / result.requests.total) * 100),
    );
  }
  console.log(`\n✅ Success Rate: ${successRate.toFixed(2)}%`);

  if (result.latency.p99 < 1000 && successRate > 95) {
    console.log("🎉 PASSED: System can handle the load efficiently!");
  } else if (successRate > 90) {
    console.log("⚠️  WARNING: System is under stress but handling requests");
  } else {
    console.log("❌ FAILED: System cannot handle the load");
  }
};

const main = async (): Promise<void> => {
  const baseUrl = process.env.API_URL || "http://localhost:3001";

  console.log("🚀 Starting Media Scraper Load Test");
  console.log(`📍 Target URL: ${baseUrl}/api/scrape`);
  console.log("\n⚙️  Test Configuration:");
  console.log("   - Simulating ~5000 concurrent requests");
  console.log("   - Target: 1 CPU, 1GB RAM server");
  console.log("   - Each request contains 10 URLs to scrape");

  // Test configuration optimized for limited resources
  const testConfig: LoadTestConfig = {
    url: `${baseUrl}/api/scrape`,
    connections: 50, // 50 concurrent connections
    duration: 30, // 30 seconds
    pipelining: 100, // 10 requests per connection = ~5000 concurrent
    workers: 4, // Use multiple workers
  };

  try {
    console.log("\n🏃 Running load test...\n");
    const result = await runLoadTest(testConfig);
    printResults(result);
  } catch (error) {
    console.error("❌ Load test failed:", error);
    process.exit(1);
  }
};

main().catch(console.error);
