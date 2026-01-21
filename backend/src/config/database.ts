import { Sequelize } from "sequelize";
import { logger } from "../utils/logger";
import { config } from "./index";

const sequelize = new Sequelize({
  dialect: config.database.dialect,
  host: config.database.host,
  port: config.database.port,
  database: config.database.database,
  username: config.database.username,
  password: config.database.password,
  pool: config.database.pool,
  ssl: true,
  //   clientMinMessages: "notice",
  logging: config.database.logging ? (msg) => logger.info(msg) : false,
  define: {
    timestamps: true,
    underscored: true,
  },
});

export const connectDatabase = async (): Promise<void> => {
  try {
    logger.info("Connecting to the database...", config.database);
    logger.info(JSON.stringify(config.database));
    await sequelize.authenticate();

    logger.info("Database connection established successfully");

    // Sync models in development (use migrations in production)
    if (config.server.nodeEnv === "development") {
      await sequelize.sync({ alter: true });
      logger.info("Database models synchronized");
    }
  } catch (error) {
    logger.error("Unable to connect to the database:", error);
    throw error;
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  try {
    await sequelize.close();
    logger.info("Database connection closed");
  } catch (error) {
    logger.error("Error closing database connection:", error);
    throw error;
  }
};

export default sequelize;
