const API_BASE = import.meta.env.VITE_API_URL || '';

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

interface FetchOptions extends RequestInit {
  skipAuth?: boolean;
}

export async function apiFetch<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { skipAuth = false, headers: customHeaders, ...rest } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(customHeaders as Record<string, string>),
  };

  if (!skipAuth && accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;

  const response = await fetch(url, {
    ...rest,
    headers,
    credentials: 'include', // send cookies for refresh token
  });

  const data = await response.json();

  if (!response.ok) {
    // Try to refresh token on 401
    if (response.status === 401 && !skipAuth && !endpoint.includes('/auth/refresh')) {
      const refreshed = await tryRefreshToken();
      if (refreshed) {
        // Retry original request with new token
        headers['Authorization'] = `Bearer ${accessToken}`;
        const retryResponse = await fetch(url, {
          ...rest,
          headers,
          credentials: 'include',
        });
        const retryData = await retryResponse.json();
        if (!retryResponse.ok) {
          throw new ApiError(
            retryData.error?.message || 'Request failed',
            retryData.error?.code || 'UNKNOWN',
            retryResponse.status
          );
        }
        return retryData.data as T;
      }
    }

    throw new ApiError(
      data.error?.message || 'Request failed',
      data.error?.code || 'UNKNOWN',
      response.status
    );
  }

  return data.data as T;
}

async function tryRefreshToken(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/api/v1/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) return false;

    const data = await response.json();
    if (data.success && data.data?.accessToken) {
      setAccessToken(data.data.accessToken);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export class ApiError extends Error {
  code: string;
  status: number;

  constructor(
    message: string,
    code: string,
    status: number
  ) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}
