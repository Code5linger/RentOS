// src/shared/types/ApiResponse.ts

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

export function successResponse<T>(
  data: T,
  meta?: ApiResponse['meta'],
): ApiResponse<T> {
  return { success: true, data, ...(meta ? { meta } : {}) };
}

export function errorResponse(code: string, message: string): ApiResponse {
  return { success: false, error: { code, message } };
}
