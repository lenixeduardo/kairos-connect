const BASE_URL = import.meta.env.VITE_KAIROS_API_URL;

function getAccessToken() {
  return localStorage.getItem('kairos_access_token');
}

function getRefreshToken() {
  return localStorage.getItem('kairos_refresh_token');
}

function saveTokens(accessToken, refreshToken) {
  if (accessToken) localStorage.setItem('kairos_access_token', accessToken);
  if (refreshToken) localStorage.setItem('kairos_refresh_token', refreshToken);
}

export function clearKairosAuth() {
  localStorage.removeItem('kairos_access_token');
  localStorage.removeItem('kairos_refresh_token');
  localStorage.removeItem('kairos_user');
}

async function refreshAccessToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) throw new Error('No refresh token');

  const res = await fetch(`${BASE_URL}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) {
    clearKairosAuth();
    throw new Error('Token refresh failed');
  }

  const data = await res.json();
  saveTokens(data.accessToken, data.refreshToken);
  return data.accessToken;
}

async function request(path, options = {}) {
  if (!BASE_URL) throw new Error('VITE_KAIROS_API_URL não configurada');

  const token = getAccessToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  let res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (res.status === 401) {
    try {
      const newToken = await refreshAccessToken();
      res = await fetch(`${BASE_URL}${path}`, {
        ...options,
        headers: { ...headers, Authorization: `Bearer ${newToken}` },
      });
    } catch {
      clearKairosAuth();
      window.dispatchEvent(new Event('kairos_auth_expired'));
      throw new Error('Sessão expirada. Faça login novamente.');
    }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: `HTTP ${res.status}` }));
    throw new Error(err.message || `HTTP ${res.status}`);
  }

  return res.json();
}

export const kairosApi = {
  isConfigured: () => !!BASE_URL,

  async login(email, password) {
    if (!BASE_URL) throw new Error('VITE_KAIROS_API_URL não configurada');

    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Credenciais inválidas');

    saveTokens(data.accessToken, data.refreshToken);
    if (data.user) localStorage.setItem('kairos_user', JSON.stringify(data.user));
    return data;
  },

  async logout() {
    try {
      await request('/api/auth/logout', { method: 'POST' });
    } finally {
      clearKairosAuth();
    }
  },

  async getMe() {
    return request('/api/auth/me');
  },

  async getWorkOrders(filters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => v && params.set(k, v));
    const qs = params.toString();
    return request(`/api/work-orders${qs ? `?${qs}` : ''}`);
  },

  async getWorkOrderKpis() {
    return request('/api/work-orders/kpis');
  },

  async getMachines() {
    return request('/api/machines');
  },

  async getMachinesMaintenanceDue() {
    return request('/api/machines/maintenance-due');
  },

  getStoredUser() {
    const raw = localStorage.getItem('kairos_user');
    try {
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
};
