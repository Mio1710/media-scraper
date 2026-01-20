import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";
import { ScrapeStatus } from "../types";

class ScrapeRequestModel extends Model {
  declare id: string;
  declare sourceUrl: string;
  declare status: ScrapeStatus;
  declare errorMessage: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

ScrapeRequestModel.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    sourceUrl: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: "source_url",
    },
    status: {
      type: DataTypes.ENUM(...Object.values(ScrapeStatus)),
      defaultValue: ScrapeStatus.PENDING,
      allowNull: false,
    },
    errorMessage: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "error_message",
    },
    createdAt: {
      type: DataTypes.DATE,
      field: "created_at",
    },
    updatedAt: {
      type: DataTypes.DATE,
      field: "updated_at",
    },
  },
  {
    sequelize,
    tableName: "scrape_requests",
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ["status"],
      },
      {
        fields: ["source_url"],
      },
    ],
  },
);

export default ScrapeRequestModel;
