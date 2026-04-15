/**
 * API Client — public API layer
 *
 * Axios instance + interceptors nằm riêng tại `./axios.ts`.
 * File này export các generic request methods, response types,
 * và helpers để các API modules sử dụng.
 */
import type { AxiosRequestConfig, AxiosResponse } from 'axios';
import apiClient from './axios';

// Re-export infrastructure từ axios.ts để consumer không cần biết file nào
export { default as apiClient } from './axios';
export { API_BASE_URL, STORAGE_KEYS } from './axios';

// ============================================================
// GENERIC REQUEST METHODS
// ============================================================
export const apiGet = <T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
  apiClient.get<T>(url, config);

export const apiPost = <T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig,
): Promise<AxiosResponse<T>> => apiClient.post<T>(url, data, config);

export const apiPut = <T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig,
): Promise<AxiosResponse<T>> => apiClient.put<T>(url, data, config);

export const apiPatch = <T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig,
): Promise<AxiosResponse<T>> => apiClient.patch<T>(url, data, config);

export const apiDelete = <T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
  apiClient.delete<T>(url, config);

// ============================================================
// GENERIC RESPONSE TYPE — dùng chung cho BE wrap responses
// ============================================================
export type ApiSuccessResponse<T> = {
  success: boolean;
  data: T;
};

// ============================================================
// HELPER: Extract data từ wrapped response
// BE interceptor wrap: { success: true, data: T }
// Axios unwrap HTTP: response.data = { success: true, data: T }
// → Lấy T: response.data.data
// ============================================================
export function extractData<T>(response: unknown): T {
  return (response as { data: { data: T } }).data.data;
}

export default apiClient;
