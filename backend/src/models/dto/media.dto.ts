import { MediaType } from "../../types";

export interface CreateMediaDto {
  scrapeRequestId: string;
  url: string;
  type: MediaType;
  alt?: string;
}
