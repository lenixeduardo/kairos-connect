import { KAIROS_API_URL } from '../config.js';
const BASE_URL = KAIROS_API_URL;

function getTokenStorage() {
  return localStorage.getItem('kairos_access_token') ? localStorage : sessionStorage;
}

function getAccessToken() {
  return localStorage.getItem('kairos_access_token') || sessionStorage.getItem('kairos_access_token');
}

function getRefreshToken() {
  return localStorage.getItem('kairos_refresh_token') || sessionStorage.getItem('kairos_refresh_token');
}

function saveTokens(accessToken, refreshToken) {
  const storage = getTokenStorage();
  if (accessToken) storage.setItem('kairos_access_token', accessToken);
  if (refreshToken) storage.setItem('kairos_refresh_token', refreshToken);
}

export function clearKairosAuth() {
  localStorage.removeItem('kairos_access_token');
  localStorage.removeItem('kairos_refresh_token');
  localStorage.removeItem('kairos_user');
  sessionStorage.removeItem('kairos_access_token');
  sessionStorage.removeItem('kairos_refresh_token');
  sessionStorage.removeItem('kairos_user');
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

async function fetchWithTimeout(url, options = {}, timeoutMs = 15000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      ...options,
      signal: options.signal || controller.signal,
    });
    return res;
  } finally {
    clearTimeout(timeoutId);
  }
}

function isNetworkError(err) {
  return err instanceof TypeError && (
    err.message.includes('fetch') ||
    err.message.includes('network') ||
    err.message.includes('Failed to fetch') ||
    err.message.includes('NetworkError')
  );
}

async function request(path, options = {}) {
  if (!BASE_URL) throw new Error('VITE_KAIROS_API_URL não configurada');

  const token = getAccessToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  let res;
  try {
    res = await fetchWithTimeout(`${BASE_URL}${path}`, { ...options, headers }, 15000);
  } catch (err) {
    // Timeout ou erro de rede
    if (err.name === 'AbortError') {
      throw new Error('O servidor KairOS não respondeu a tempo (timeout). Verifique se o backend está ativo.');
    }
    if (isNetworkError(err)) {
      throw new Error('Sem conexão com o servidor KairOS. Verifique sua conexão de rede.');
    }
    throw err;
  }

  if (res.status === 401) {
    if (!token) {
      throw new Error('Sem autenticação. Faça login com uma conta válida para acessar esta funcionalidade.');
    }
    try {
      const newToken = await refreshAccessToken();
      res = await fetchWithTimeout(`${BASE_URL}${path}`, {
        ...options,
        headers: { ...headers, Authorization: `Bearer ${newToken}` },
      }, 15000);
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
    const raw = localStorage.getItem('kairos_user') || sessionStorage.getItem('kairos_user');
    try {
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
};
