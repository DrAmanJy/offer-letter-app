export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: unknown[];
  meta?: {
    totalItems?: number;
    totalPages?: number;
    page?: number;
    limit?: number;
    hasNext?: boolean;
    hasPrev?: boolean;
    [key: string]: any;
  };
}
