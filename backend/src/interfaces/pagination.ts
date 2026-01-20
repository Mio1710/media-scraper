export interface PaginationParams {
  page: number;
  limit: number;
}
export interface Pagination {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}
export interface PaginatedResponse<T> {
  data: T[];
  pagination: Pagination;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  pagination?: Pagination;
  error?: string;
  message?: string;
}
