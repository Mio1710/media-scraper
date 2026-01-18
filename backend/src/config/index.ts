import dotenv from "dotenv";

// Load environment variables
dotenv.config();

interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  dialect: "postgres";
  pool: {
    max: number;
    min: number;
    acquire: number;
    idle: number;
  };
  logging: boolean;
}

interface RedisConfig {
  host: string;
  port: number;
}

interface ServerConfig {
  port: number;
  host: string;
  nodeEnv: string;
  crossOrigin: string[];
}

interface ScraperConfig {
  maxConcurrentScrapes: number;
  scrapeTimeout: number;
  maxRetries: number;
}

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

interface PaginationConfig {
  defaultPageSize: number;
  maxPageSize: number;
}

interface AppConfig {
  server: ServerConfig;
  database: DatabaseConfig;
  redis: RedisConfig;
  scraper: ScraperConfig;
  rateLimit: RateLimitConfig;
  pagination: PaginationConfig;
}

const getEnvNumber = (key: string, defaultValue: number): number => {
  const value = process.env[key];
  if (value === undefined) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
};

const getEnvString = (key: string, defaultValue: string): string => {
  return process.env[key] ?? defaultValue;
};

const getEnvBoolean = (key: string, defaultValue: boolean): boolean => {
  const value = process.env[key];
  if (value === undefined) return defaultValue;
  return value.toLowerCase() === "true";
};

export const config: AppConfig = {
  server: {
    port: getEnvNumber("PORT", 3001),
    host: getEnvString("HOST", "0.0.0.0"),
    nodeEnv: getEnvString("NODE_ENV", "development"),
    crossOrigin: getEnvString("CORS_ORIGIN", "*").split(","),
  },
  database: {
    host: getEnvString("DB_HOST", "localhost"),
    port: getEnvNumber("DB_PORT", 5432),
    database: getEnvString("DB_NAME", "media_scraper"),
    username: getEnvString("DB_USER", "postgres"),
    password: getEnvString("DB_PASSWORD", "password123"),
    dialect: "postgres",
    pool: {
      max: 20,
      min: 5,
      acquire: 60000,
      idle: 10000,
    },
    logging: getEnvBoolean("DB_LOGGING", false),
  },
  redis: {
    host: getEnvString("REDIS_HOST", "localhost"),
    port: getEnvNumber("REDIS_PORT", 6379),
  },
  scraper: {
    maxConcurrentScrapes: getEnvNumber("MAX_CONCURRENT_SCRAPES", 100),
    scrapeTimeout: getEnvNumber("SCRAPE_TIMEOUT", 30000),
    maxRetries: getEnvNumber("MAX_RETRIES", 3),
  },
  rateLimit: {
    windowMs: getEnvNumber("RATE_LIMIT_WINDOW_MS", 60000),
    maxRequests: getEnvNumber("RATE_LIMIT_MAX_REQUESTS", 1000),
  },
  pagination: {
    defaultPageSize: getEnvNumber("DEFAULT_PAGE_SIZE", 20),
    maxPageSize: getEnvNumber("MAX_PAGE_SIZE", 100),
  },
};

export default config;
