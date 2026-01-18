import { Op, Transaction, WhereOptions } from "sequelize";
import MediaModel from "../models/Media";
import { Media, MediaFilter, MediaType, PaginatedResponse, PaginationParams } from "../types";

/**
 * Data structure for creating media entries.
 */
export interface MediaData {
  readonly scrapeRequestId: string;
  readonly url: string;
  readonly type: MediaType;
  readonly sourceUrl: string;
  readonly title?: string;
  readonly alt?: string;
  readonly width?: number;
  readonly height?: number;
  readonly fileSize?: number;
  readonly mimeType?: string;
}

export class MediaRepository {
  public async createMedia(data: MediaData, transaction?: Transaction): Promise<MediaModel> {
    return MediaModel.create(data, { transaction });
  }

  public async createBulkMedia(data: MediaData[], transaction?: Transaction): Promise<MediaModel[]> {
    return MediaModel.bulkCreate(data, {
      transaction,
      ignoreDuplicates: true,
    });
  }

  public async findById(id: string): Promise<MediaModel | null> {
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
      data: rows.map((row) => row.toJSON() as Media),
      pagination: {
        page,
        limit,
        totalItems: count,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
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
