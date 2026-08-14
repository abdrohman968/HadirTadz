/**
 * Central API Client Helper (Auto-Migration Ready)
 * Allows seamless switching between Next.js internal API Routes and external PHP backend.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  user?: any;
  error?: string;
}

export async function fetchAPI<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = endpoint.startsWith('http')
    ? endpoint
    : `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    });

    const data = await res.json();
    return data;
  } catch (error: any) {
    console.error(`[fetchAPI Error] ${endpoint}:`, error);
    return {
      success: false,
      message: error?.message || 'Gagal terhubung ke server',
      error: error?.toString(),
    };
  }
}
