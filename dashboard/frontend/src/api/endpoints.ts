import { apiFetch } from './client';
import type { AuthResponse, DashboardData, AlertItem } from '../shared/types';

// --- Auth API ---
export const authApi = {
  register: (data: { email: string; name: string; password: string }) =>
    apiFetch<AuthResponse>('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
      skipAuth: true,
    }),

  login: (data: { email: string; password: string }) =>
    apiFetch<AuthResponse>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
      skipAuth: true,
    }),

  refresh: () =>
    apiFetch<{ accessToken: string }>('/api/v1/auth/refresh', {
      method: 'POST',
      skipAuth: true,
    }),

  logout: () =>
    apiFetch<{ message: string }>('/api/v1/auth/logout', {
      method: 'POST',
    }),

  me: () =>
    apiFetch<{ user: AuthResponse['user'] }>('/api/v1/auth/me'),
};

// --- Metrics API ---
export const metricsApi = {
  getDashboard: (range: string = '7d') =>
    apiFetch<DashboardData>(`/api/v1/metrics/dashboard?range=${range}`),
};

// --- Alerts API ---
export const alertsApi = {
  getAlerts: (params: { page?: number; pageSize?: number; status?: string; severity?: string } = {}) => {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set('page', String(params.page));
    if (params.pageSize) searchParams.set('pageSize', String(params.pageSize));
    if (params.status) searchParams.set('status', params.status);
    if (params.severity) searchParams.set('severity', params.severity);
    return apiFetch<AlertItem[]>(`/api/v1/alerts?${searchParams.toString()}`);
  },

  acknowledgeAlert: (id: string) =>
    apiFetch<AlertItem>(`/api/v1/alerts/${id}/acknowledge`, { method: 'PATCH' }),

  resolveAlert: (id: string) =>
    apiFetch<AlertItem>(`/api/v1/alerts/${id}/resolve`, { method: 'PATCH' }),
};
