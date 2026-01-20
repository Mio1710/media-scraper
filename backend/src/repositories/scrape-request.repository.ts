import { Transaction } from "sequelize";
import { PaginatedResponse } from "../interfaces/pagination";
import MediaModel from "../models/Media";
import ScrapeRequestModel from "../models/ScrapeRequest";
import { ScrapeJobResult, ScrapeStatus } from "../types/scraper";
import logger from "../utils/logger";

interface CreateScrapeRequestData {
  readonly sourceUrl: string;
  readonly status?: ScrapeStatus;
}

export class ScrapeRequestRepository {
  public async createRequest(data: CreateScrapeRequestData, transaction?: Transaction): Promise<ScrapeRequestModel> {
    return ScrapeRequestModel.create(
      {
        ...data,
        status: data.status ?? ScrapeStatus.PENDING,
      },
      { transaction },
    );
  }

  public async createBulkRequests(data: string[], transaction: Transaction): Promise<ScrapeRequestModel[]> {
    return ScrapeRequestModel.bulkCreate(
      data.map((sourceUrl) => ({
        sourceUrl,
        status: ScrapeStatus.PENDING,
      })),
      { transaction },
    );
  }

  public async findById(id: string): Promise<ScrapeRequestModel | null> {
    return ScrapeRequestModel.findByPk(id);
  }

  public async findBySourceUrl(sourceUrl: string): Promise<ScrapeRequestModel | null> {
    return ScrapeRequestModel.findOne({
      where: { sourceUrl },
      order: [["createdAt", "DESC"]],
    });
  }

  public async findByStatus(status: ScrapeStatus): Promise<ScrapeRequestModel[]> {
    return ScrapeRequestModel.findAll({
      where: { status },
      order: [["createdAt", "ASC"]],
    });
  }

  public async updateStatus(
    id: string,
    status: ScrapeStatus,
    errorMessage?: string,
    transaction?: Transaction,
  ): Promise<[number]> {
    return ScrapeRequestModel.update({ status, errorMessage: errorMessage ?? null }, { where: { id }, transaction });
  }

  public async countByStatus(): Promise<{ status: ScrapeStatus; count: number }[]> {
    const results = await ScrapeRequestModel.findAll({
      attributes: [
        "status",
        [ScrapeRequestModel.sequelize!.fn("COUNT", ScrapeRequestModel.sequelize!.col("id")), "count"],
      ],
      group: ["status"],
      raw: true,
    });
    return results as unknown as { status: ScrapeStatus; count: number }[];
  }

  public async deleteById(id: string, transaction?: Transaction): Promise<number> {
    return ScrapeRequestModel.destroy({ where: { id }, transaction });
  }

  public async findAllPaginated(
    pagination: { page: number; limit: number },
    status?: ScrapeStatus,
  ): Promise<PaginatedResponse<ScrapeJobResult>> {
    try {
      const { page, limit } = pagination;
      const offset = (page - 1) * limit;
      const whereClause = status ? { status } : {};
      const { rows, count } = await ScrapeRequestModel.findAndCountAll({
        attributes: ["id", "sourceUrl", "status", "errorMessage", "createdAt", "updatedAt"],
        where: whereClause,
        limit,
        offset,
        order: [["createdAt", "DESC"]],
        include: [
          {
            model: MediaModel,
            as: "media",
          },
        ],
      });
      rows.map((row) => {
        (row as any).dataValues.mediaCount = (row as any).media ? (row as any).media.length : 0;
        delete (row as any).dataValues.media;
      });

      const totalPages = Math.ceil((Array.isArray(count) ? count.length : count) / limit);
      return {
        data: rows as unknown as ScrapeJobResult[],
        pagination: {
          page,
          limit,
          totalItems: Array.isArray(count) ? count.length : count,
          totalPages,
        },
      };
    } catch (error) {
      logger.debug("Error in findAllPaginated:", error);
      throw error;
    }
  }
}

export const scrapeRequestRepository = new ScrapeRequestRepository();
