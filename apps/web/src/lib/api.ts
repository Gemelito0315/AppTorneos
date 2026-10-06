const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export class ApiError extends Error {
  statusCode: number;
  data: any;

  constructor(message: string, statusCode: number, data?: any) {
    super(message);
    this.statusCode = statusCode;
    this.data = data;
    this.name = 'ApiError';
  }
}

// ─── Token refresh logic ────────────────────────────────────
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

async function tryRefreshToken(): Promise<string | null> {
  const refreshToken = typeof window !== 'undefined'
    ? localStorage.getItem('billar_refresh_token')
    : null;

  if (!refreshToken) return null;

  try {
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    const newAccessToken = data.tokens?.accessToken || data.accessToken;
    const newRefreshToken = data.tokens?.refreshToken || data.refreshToken;

    if (newAccessToken) {
      localStorage.setItem('billar_access_token', newAccessToken);
    }
    if (newRefreshToken) {
      localStorage.setItem('billar_refresh_token', newRefreshToken);
    }

    return newAccessToken || null;
  } catch {
    return null;
  }
}

async function getRefreshedToken(): Promise<string | null> {
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }
  isRefreshing = true;
  refreshPromise = tryRefreshToken().finally(() => {
    isRefreshing = false;
    refreshPromise = null;
  });
  return refreshPromise;
}

// ─── Main API request function ──────────────────────────────
export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('billar_access_token') : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_URL}${cleanEndpoint}`;

  let response = await fetch(url, {
    cache: 'no-store',
    ...options,
    headers,
  });

  // ── Auto-refresh on 401 ──────────────────────────────────
  if (response.status === 401 && typeof window !== 'undefined') {
    const newToken = await getRefreshedToken();
    if (newToken) {
      headers['Authorization'] = `Bearer ${newToken}`;
      response = await fetch(url, {
        cache: 'no-store',
        ...options,
        headers,
      });
    }
  }

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const errorMsg =
      (isJson && data?.message) ||
      (typeof data === 'string' ? data : 'Error en la petición al servidor');
    throw new ApiError(Array.isArray(errorMsg) ? errorMsg.join(', ') : errorMsg, response.status, data);
  }

  return data as T;
}
