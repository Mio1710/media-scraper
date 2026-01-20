import { Op, Transaction, WhereOptions } from "sequelize";
import { ICreateMedia, Media } from "../interfaces";
import { PaginatedResponse, PaginationParams } from "../interfaces/pagination";
import MediaModel from "../models/Media";
import { MediaFilter, MediaType } from "../types";

export class MediaRepository {
  public async createMedia(data: ICreateMedia, transaction?: Transaction): Promise<MediaModel> {
    return MediaModel.create(data, { transaction });
  }

  public async createBulkMedia(data: ICreateMedia[], transaction?: Transaction): Promise<MediaModel[]> {
    return MediaModel.bulkCreate(data, {
      transaction,
      ignoreDuplicates: true,
    });
  }

  public async findById(id: string): Promise<Media | null> {
    return MediaModel.findByPk(id);
  }

  public async findByUrl(url: string): Promise<MediaModel | null> {
    return MediaModel.findOne({ where: { url } });
  }

  public async findByScrapeRequestId(scrapeRequestId: string): Promise<MediaModel[]> {
    return MediaModel.findAll({
      where: { scrapeRequestId },
      order: [["createdAt", "DESC"]],
    });
  }

  public async findAllPaginated(pagination: PaginationParams, filter: MediaFilter): Promise<PaginatedResponse<Media>> {
    const { page, limit } = pagination;
    const offset = (page - 1) * limit;
    const whereClause = this.buildWhereClause(filter);
    const { rows, count } = await MediaModel.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [["createdAt", "DESC"]],
    });
    const totalPages = Math.ceil(count / limit);
    return {
      data: rows,
      pagination: {
        page,
        limit,
        totalItems: count,
        totalPages,
      },
    };
  }

  public async countByType(): Promise<{ type: MediaType; count: number }[]> {
    const results = await MediaModel.findAll({
      attributes: ["type", [MediaModel.sequelize!.fn("COUNT", MediaModel.sequelize!.col("id")), "count"]],
      group: ["type"],
      raw: true,
    });
    return results as unknown as { type: MediaType; count: number }[];
  }

  public async deleteById(id: string): Promise<number> {
    return MediaModel.destroy({ where: { id } });
  }

  public async deleteByScrapeRequestId(scrapeRequestId: string, transaction?: Transaction): Promise<number> {
    return MediaModel.destroy({
      where: { scrapeRequestId },
      transaction,
    });
  }

  private buildWhereClause(filter: MediaFilter): WhereOptions {
    const whereClause: WhereOptions = {};
    if (filter.type) {
      whereClause.type = filter.type;
    }
    if (filter.sourceUrl) {
      whereClause.sourceUrl = filter.sourceUrl;
    }
    if (filter.search) {
      whereClause[Op.or as unknown as string] = [
        { title: { [Op.like]: `%${filter.search}%` } },
        { alt: { [Op.like]: `%${filter.search}%` } },
        { url: { [Op.like]: `%${filter.search}%` } },
      ];
    }
    return whereClause;
  }
}

export const mediaRepository = new MediaRepository();
