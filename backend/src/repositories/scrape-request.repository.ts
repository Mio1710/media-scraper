import { Transaction } from "sequelize";
import ScrapeRequestModel from "../models/ScrapeRequest";
import { ScrapeStatus } from "../types";

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
}

export const scrapeRequestRepository = new ScrapeRequestRepository();
