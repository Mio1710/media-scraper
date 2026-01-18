import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";
import { MediaType } from "../types";
import ScrapeRequestModel from "./ScrapeRequest";

interface MediaAttributes {
  id: string;
  scrapeRequestId: string;
  url: string;
  type: MediaType;
  sourceUrl: string;
  title: string | null;
  alt: string | null;
  width: number | null;
  height: number | null;
  fileSize: number | null;
  mimeType: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface MediaCreationAttributes extends Optional<
  MediaAttributes,
  "id" | "title" | "alt" | "width" | "height" | "fileSize" | "mimeType" | "createdAt" | "updatedAt"
> {}

class MediaModel extends Model<MediaAttributes, MediaCreationAttributes> implements MediaAttributes {
  public id!: string;
  public scrapeRequestId!: string;
  public url!: string;
  public type!: MediaType;
  public sourceUrl!: string;
  public title!: string | null;
  public alt!: string | null;
  public width!: number | null;
  public height!: number | null;
  public fileSize!: number | null;
  public mimeType!: string | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
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
    sourceUrl: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: "source_url",
    },
    title: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    alt: {
      type: DataTypes.STRING(1000),
      allowNull: true,
    },
    width: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    height: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    fileSize: {
      type: DataTypes.BIGINT,
      allowNull: true,
      field: "file_size",
    },
    mimeType: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: "mime_type",
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
        fields: ["source_url"],
      },
      {
        fields: ["scrape_request_id"],
      },
      {
        fields: ["created_at"],
      },
      {
        type: "FULLTEXT",
        fields: ["title", "alt"],
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
