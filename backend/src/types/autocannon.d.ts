declare module "autocannon" {
  interface Options {
    url: string;
    connections?: number;
    duration?: number;
    pipelining?: number;
    workers?: number;
    method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "HEAD" | "OPTIONS";
    headers?: Record<string, string>;
    body?: string;
    timeout?: number;
    title?: string;
  }

  interface Result {
    title?: string;
    url: string;
    duration: number;
    connections: number;
    requests: {
      total: number;
      average: number;
      mean: number;
      stddev: number;
      min: number;
      max: number;
      p0_001: number;
      p0_01: number;
      p0_1: number;
      p1: number;
      p2_5: number;
      p10: number;
      p25: number;
      p50: number;
      p75: number;
      p90: number;
      p97_5: number;
      p99: number;
      p99_9: number;
      p99_99: number;
      p99_999: number;
    };
    latency: {
      average: number;
      mean: number;
      stddev: number;
      min: number;
      max: number;
      p0_001: number;
      p0_01: number;
      p0_1: number;
      p1: number;
      p2_5: number;
      p10: number;
      p25: number;
      p50: number;
      p75: number;
      p90: number;
      p97_5: number;
      p99: number;
      p99_9: number;
      p99_99: number;
      p99_999: number;
    };
    throughput: {
      average: number;
      mean: number;
      stddev: number;
      min: number;
      max: number;
      total: number;
      p0_001: number;
      p0_01: number;
      p0_1: number;
      p1: number;
      p2_5: number;
      p10: number;
      p25: number;
      p50: number;
      p75: number;
      p90: number;
      p97_5: number;
      p99: number;
      p99_9: number;
      p99_99: number;
      p99_999: number;
    };
    errors: number;
    timeouts: number;
    non2xx: number;
    resets: number;
    mismatches: number;
    start: Date;
    finish: Date;
  }

  interface Instance {
    on(
      event: "response",
      callback: (client: unknown, statusCode: number, resBytes: number, responseTime: number) => void,
    ): void;
    on(event: "done", callback: (result: Result) => void): void;
  }

  function autocannon(options: Options, callback?: (err: Error | null, result: Result) => void): Instance;

  namespace autocannon {
    function track(instance: Instance, options?: { renderProgressBar?: boolean }): void;
  }

  export = autocannon;
}
