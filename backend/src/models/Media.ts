import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";
import { MediaType } from "../types";
import { CreateMediaAttr } from "../types/media";
import ScrapeRequestModel from "./ScrapeRequest";

class MediaModel extends Model<CreateMediaAttr> {
  declare id: string;
  declare scrapeRequestId: string;
  declare url: string;
  declare type: MediaType;
  declare alt: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

MediaModel.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    scrapeRequestId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "scrape_request_id",
      references: {
        model: "scrape_requests",
        key: "id",
      },
    },
    url: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM(...Object.values(MediaType)),
      allowNull: false,
    },
    alt: {
      type: DataTypes.TEXT,
      allowNull: true,
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
    tableName: "media",
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ["type"],
      },
      {
        fields: ["scrape_request_id"],
      },
      {
        type: "FULLTEXT",
        fields: ["alt"],
        name: "media_fulltext_idx",
      },
    ],
  },
);

// Set up association
MediaModel.belongsTo(ScrapeRequestModel, {
  foreignKey: "scrapeRequestId",
  as: "scrapeRequest",
});

ScrapeRequestModel.hasMany(MediaModel, {
  foreignKey: "scrapeRequestId",
  as: "media",
});

export default MediaModel;
