import { Optional } from "sequelize";
import { MediaType } from "../types";

export type MediaAttribute = {
  id: string;
  scrapeRequestId: string;
  url: string;
  type: MediaType;
  alt?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateMediaAttr = Optional<
  MediaAttribute,
  "id" | "scrapeRequestId" | "url" | "alt" | "createdAt" | "updatedAt"
>;
