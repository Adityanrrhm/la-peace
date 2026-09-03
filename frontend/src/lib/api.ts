import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import type { ApiError } from '@/types/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Important for HttpOnly cookie
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor - add request ID for tracing
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const requestId = crypto.randomUUID();
    config.headers['X-Request-ID'] = requestId;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ error: ApiError }>) => {
    if (error.response?.status === 401) {
      // Clear auth state and redirect to login
      if (typeof window !== 'undefined') {
        // Dispatch custom event for auth context to handle
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
      }
    }
    return Promise.reject(error);
  }
);

// Helper to extract error message
export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const apiError = error.response?.data?.error;
    if (apiError?.message) return apiError.message;
    if (error.message) return error.message;
  }
  if (error instanceof Error) return error.message;
  return 'Terjadi kesalahan tidak diketahui';
}

// Helper to check if error is validation error
export function isValidationError(error: unknown): boolean {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.error?.code === 'VALIDATION_ERROR';
  }
  return false;
}

// Helper to get validation details
export function getValidationDetails(error: unknown): Record<string, string[]> | null {
  if (axios.isAxiosError(error)) {
    const details = error.response?.data?.error?.details;
    if (details && typeof details === 'object') {
      return details as Record<string, string[]>;
    }
  }
  return null;
}