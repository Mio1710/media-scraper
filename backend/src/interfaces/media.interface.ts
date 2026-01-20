import { MediaType } from "../types";

export interface ICreateMedia {
  scrapeRequestId: string;
  url: string;
  type: MediaType;
  alt?: string;
}

export interface Media {
  id: string;
  scrapeRequestId: string;
  url: string;
  type: MediaType;
  alt?: string;
  createdAt: Date;
  updatedAt: Date;
}
