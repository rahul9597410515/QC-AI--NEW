// ============================================
// QC AI — Centralized API Client
// All fetch calls go through this module.
// ============================================

const BASE_URL = '/api';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
        ...options,
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error((err as { error?: string }).error ?? res.statusText);
    }

    if (res.status === 204) return undefined as T;
    return res.json() as Promise<T>;
}

export const api = {
    // ── Defects ────────────────────────────
    getDefects: (params?: Record<string, string>) => {
        const qs = params ? '?' + new URLSearchParams(params).toString() : '';
        return request<{ items: unknown[]; total: number; page: number; limit: number }>(`/defects${qs}`);
    },
    getDefectSummary: () => request<{ total: number; bySeverity: unknown[]; byType: unknown[] }>('/defects/summary'),

    // ── Sensors ────────────────────────────
    getSensorsLatest: () => request<unknown[]>('/sensors/latest'),
    getSensorsHistory: (minutes = 30) => request<unknown[]>(`/sensors/history?minutes=${minutes}`),

    // ── Alerts ─────────────────────────────
    getAlerts: (severity?: string) => {
        const qs = severity ? `?severity=${severity}` : '';
        return request<unknown[]>(`/alerts${qs}`);
    },
    acknowledgeAlert: (id: string) => request<unknown>(`/alerts/${id}/acknowledge`, { method: 'PATCH' }),
    dismissAlert: (id: string) => request<void>(`/alerts/${id}`, { method: 'DELETE' }),

    // ── Analytics ──────────────────────────
    getHourly: () => request<unknown[]>('/analytics/hourly'),
    getDaily: (days = 30) => request<unknown[]>(`/analytics/daily?days=${days}`),
    getDefectTypes: () => request<unknown[]>('/analytics/defect-types'),
    getHeatmap: () => request<number[][]>('/analytics/heatmap'),

    // ── Reports ────────────────────────────
    getReportSummary: () => request<{ total: number; critical: number; warning: number; info: number; last24h: number; passRate: number }>('/reports/summary'),
    exportReport: (body: Record<string, string>) =>
        fetch(`${BASE_URL}/reports/export`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),

    // ── Config ─────────────────────────────
    getConfig: () => request<{ environment: string; thresholds: unknown }[]>('/config'),
    updateConfig: (environment: string, thresholds: unknown) =>
        request<unknown>('/config', { method: 'PUT', body: JSON.stringify({ environment, thresholds }) }),

    // ── AI Analysis ────────────────────────
    analyzeImage: (file: File, environment = 'Automotive') => {
        const form = new FormData();
        form.append('image', file);
        form.append('environment', environment);
        return fetch(`${BASE_URL}/analyze`, { method: 'POST', body: form }).then(r => r.json()) as Promise<{ boxes: unknown[]; processingTimeMs: number; provider: string }>;
    },

    // ── Auth ───────────────────────────────
    login: (email: string, password: string) =>
        request<{ token: string; user: { id: string; email: string; role: string } }>('/auth/login', {
            method: 'POST', body: JSON.stringify({ email, password }),
        }),
};
