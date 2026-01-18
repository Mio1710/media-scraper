import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";
import { ScrapeStatus } from "../types";

interface ScrapeRequestAttributes {
  id: string;
  sourceUrl: string;
  status: ScrapeStatus;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface ScrapeRequestCreationAttributes extends Optional<
  ScrapeRequestAttributes,
  "id" | "errorMessage" | "createdAt" | "updatedAt"
> {}

class ScrapeRequestModel
  extends Model<ScrapeRequestAttributes, ScrapeRequestCreationAttributes>
  implements ScrapeRequestAttributes
{
  public id!: string;
  public sourceUrl!: string;
  public status!: ScrapeStatus;
  public errorMessage!: string | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
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
      {
        fields: ["created_at"],
      },
    ],
  },
);

export default ScrapeRequestModel;
